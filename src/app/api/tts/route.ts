/**
 * Edge TTS API route — converts text to speech using Microsoft Edge's TTS service.
 * POST { text: string } → audio/mpeg stream
 */
import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const DEFAULT_VOICE = "en-GB-RyanNeural"; // Natural British male voice
const MAX_LENGTH = 2000; // Max characters per request

/** Allowed voice short-names to prevent abuse */
const ALLOWED_VOICES = new Set([
  // GB
  "en-GB-SoniaNeural", "en-GB-RyanNeural", "en-GB-LibbyNeural",
  "en-GB-MaisieNeural", "en-GB-ThomasNeural",
  // US
  "en-US-AvaNeural", "en-US-AndrewNeural", "en-US-EmmaNeural",
  "en-US-BrianNeural", "en-US-AriaNeural", "en-US-JennyNeural",
  "en-US-GuyNeural", "en-US-ChristopherNeural", "en-US-MichelleNeural",
  "en-US-EricNeural", "en-US-RogerNeural", "en-US-SteffanNeural",
  // AU
  "en-AU-NatashaNeural", "en-AU-WilliamMultilingualNeural",
  // IE
  "en-IE-ConnorNeural", "en-IE-EmilyNeural",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = (body.text ?? "").trim();
    const voice = (body.voice ?? "").trim();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (text.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `Text too long (max ${MAX_LENGTH} chars)` },
        { status: 400 },
      );
    }

    const selectedVoice = voice && ALLOWED_VOICES.has(voice) ? voice : DEFAULT_VOICE;

    // Instantiate a new TTS client per request (manages its own websocket)
    const edgeTts = new MsEdgeTTS();
    await edgeTts.setMetadata(
      selectedVoice,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );

    const { audioStream } = edgeTts.toStream(text, {
      rate: "-5%",  // Slightly slower for comprehension
      pitch: "+0Hz",
    });

    // Collect audio chunks into a single buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    edgeTts.close();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("[TTS] Edge TTS error:", error);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 },
    );
  }
}
