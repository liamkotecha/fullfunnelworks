import { authenticator } from "otplib";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// OTP is 6 digits, expires in 10 minutes
authenticator.options = {
  digits: 6,
  step: 600,
  window: 1,
};

/** Generate a 6-digit OTP and store its hash + expiry on the user document */
export async function generateAndStoreOTP(email: string): Promise<string> {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Create a stub user so OTP can be stored before they fully register
    const newUser = await User.create({
      email: email.toLowerCase(),
      name: email.split("@")[0],
      role: "client",
    });
    const secret = authenticator.generateSecret();
    const token = authenticator.generate(secret);
    newUser.otpSecret = secret;
    newUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await newUser.save();
    return token;
  }

  const secret = authenticator.generateSecret();
  const token = authenticator.generate(secret);
  user.otpSecret = secret;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  return token;
}

/** Verify a 6-digit OTP for an email, returns userId if valid */
export async function verifyOTP(email: string, token: string): Promise<string | null> {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.otpSecret || !user.otpExpiry) return null;

  // Check expiry
  if (new Date() > user.otpExpiry) {
    user.otpSecret = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return null;
  }

  const isValid = authenticator.check(token, user.otpSecret);
  if (!isValid) return null;

  // Clear OTP after successful verification
  user.otpSecret = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return user._id.toString();
}
