import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const RP_NAME = process.env.WEBAUTHN_RP_NAME ?? "Full Funnel";
const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";

// ── Registration ──────────────────────────────────────────

export async function getRegistrationOptions(userId: string, email: string) {
  await connectDB();
  const user = await User.findById(userId);
  const existingCredentials = user?.passkeyCredentials ?? [];

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: email,
    attestationType: "none",
    excludeCredentials: existingCredentials.map((c: { credentialId: string; transports: string[] }) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Store challenge temporarily on user document
  if (user) {
    user.currentChallenge = options.challenge;
    await user.save();
  }

  return options;
}

export async function verifyRegistration(
  userId: string,
  response: RegistrationResponseJSON
) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user || !user.currentChallenge) throw new Error("No challenge found");

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: user.currentChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verification.verified && verification.registrationInfo) {
    const info = verification.registrationInfo as unknown as {
      credentialID: Uint8Array;
      credentialPublicKey: Uint8Array;
      counter: number;
    };
    user.passkeyCredentials.push({
      credentialId: Buffer.from(info.credentialID).toString("base64url"),
      publicKey: Buffer.from(info.credentialPublicKey).toString("base64"),
      counter: info.counter,
      transports: response.response.transports ?? [],
    });
    user.currentChallenge = undefined;
    await user.save();
  }

  return verification;
}

// ── Authentication ────────────────────────────────────────

export async function getAuthenticationOptions(email?: string) {
  await connectDB();

  let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = [];

  if (email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user?.passkeyCredentials?.length) {
      allowCredentials = user.passkeyCredentials.map((c: { credentialId: string; transports: string[] }) => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransport[],
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
    allowCredentials,
  });

  // Store challenge globally (per-session in real app)
  return options;
}

export async function verifyAuthentication(
  email: string,
  response: AuthenticationResponseJSON,
  challenge: string
) {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found");

  const credential = user.passkeyCredentials.find(
    (c: { credentialId: string }) => c.credentialId === response.id
  );
  if (!credential) throw new Error("Credential not found");

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: Buffer.from(credential.credentialId, "base64url"),
      credentialPublicKey: Buffer.from(credential.publicKey, "base64"),
      counter: credential.counter,
      transports: credential.transports as AuthenticatorTransport[],
    },
  } as unknown as Parameters<typeof verifyAuthenticationResponse>[0]);

  if (verification.verified) {
    credential.counter = verification.authenticationInfo.newCounter;
    await user.save();
  }

  return { verification, userId: user._id.toString() };
}
