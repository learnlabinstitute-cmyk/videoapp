import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Verse & Invitation message generator
app.post("/api/gemini/generate-verse", async (req, res) => {
  try {
    const { name, age = 1, gender = "girl", theme = "fairytale train", occasion = "1st Birthday" } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        verse: `Chugging along on the fairy-tale track, sweet ${name || "Little One"} turns ONE and there's no looking back! With smiles so bright and giggles galore, come join the celebration we adore!`,
        subline: `A year of wonder, joy, and grace, bringing pure sunshine to every place.`,
        suggestedHashtags: [`#${(name || "Baby").replace(/\s+/g, "")}TurnsOne`, "#FirstBirthdayMagic", "#FairyTaleTrain", "#MilestoneCelebration"]
      });
    }

    const ai = getAI();
    const prompt = `Write a charming, poetic 2-4 line rhyming verse for a child's ${occasion} invitation video.
Child's Name: ${name || "our little sweetheart"}
Age turning: ${age}
Gender: ${gender}
Theme: ${theme} (e.g. magical floral train express, pastel fairy tale, royal prince/princess).

Respond with valid JSON in this structure:
{
  "verse": "a joyful rhyming 2-3 lines poem celebration verse",
  "subline": "a tender one-sentence invite tagline",
  "suggestedHashtags": ["#tag1", "#tag2", "#tag3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini verse error:", error);
    res.json({
      verse: `All aboard the celebration express! Sweet dreams and giggles we confess, as our precious star turns ONE today, come dance and laugh and play!`,
      subline: `With hearts full of love, we invite you to celebrate this magical milestone!`,
      suggestedHashtags: ["#FirstBirthday", "#SweetOne", "#CelebrationTime"]
    });
  }
});

// AI Baby Voice Script Generator
app.post("/api/gemini/generate-baby-script", async (req, res) => {
  try {
    const { name = "Baby", age = 1, expression = "funny", gender = "girl" } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      const fallbackScripts: Record<string, string[]> = {
        funny: [
          `Goo goo gaga! Guess who is eating the whole birthday cake with both hands today?! Me! No broccoli allowed, only frosting and party hats!`,
          `Attention passengers! This is Conductor ${name} speaking from the birthday train! My official royal orders: unlimited balloons and loud giggles!`,
          `I survived 365 days of tummy time and drinking milk! Now hand over the presents and let's boogie!`
        ],
        cheerful: [
          `Yay! It's my big 1st Birthday! The fairytale train has arrived and everyone is invited to celebrate with me!`,
          `Welcome to my special celebration! Thank you for loving me and sharing big warm hugs today!`,
          `Look at me, I'm turning ONE! Let's sing Happy Birthday and make wonderful memories together!`
        ],
        excited: [
          `Choo-choo! All aboard my magical 1st Birthday Express! Next stop: Fun town, balloons, and cake!`,
          `Hooray! Today is the happiest day ever! Put on your dancing shoes and join my birthday party!`,
          `Beep beep! The celebration train is rolling in, and I cannot wait to see all of you!`
        ],
        cute_sweet: [
          `Tank you for coming to my first birthday party. You make my heart sparkle with joy!`,
          `One whole year of sweet baby cuddles and kisses. Come blow out the candle with me!`,
          `I'm still little, but my love for all of you is as big as the sky! Welcome to my party!`
        ],
        royal_prince_princess: [
          `Hear ye, hear ye! By royal decree of ${gender === 'boy' ? 'Prince' : 'Princess'} ${name}, the 1st Birthday royal court is officially in session!`,
          `Welcome to our kingdom of laughter and cake! Your royal invitation has arrived!`,
          `Put on your crowns and tiaras! The royal train carriage is departing for our grand party!`
        ],
        giggle_laugh: [
          `Hehehehe! Peekaboo! Did you know I'm already ONE year old?! Let's giggle and eat yummy treats!`,
          `Tee-hee! Tickles, hugs, and big cake smiles! Come play with me at my birthday party!`,
          `Giggle giggle! The train goes chugga chugga and I go woohoo! See you at my party!`
        ]
      };
      const list = fallbackScripts[expression] || fallbackScripts.funny;
      return res.json({ scripts: list });
    }

    const ai = getAI();
    const prompt = `Write 3 short, super adorable, highly expressive speaking scripts for a child's 1st birthday video narration.
The voiceover is voiced by the baby/toddler speaking to guests!
Child Name: ${name}
Age: ${age}
Gender: ${gender}
Feeling / Expression: ${expression} (e.g. funny and silly, cheerful and bubbly, excited energy, cute and sweet cooing, royal prince/princess, or giggly laugh).
Requirements:
- Length: 20 to 35 words per script (about 6 to 9 seconds of speaking).
- Include funny toddler slang, adorable expressions like "goo goo gaa gaa", cute pronunciation, giggles, or enthusiastic party announcements.
- Return valid JSON: { "scripts": ["script 1", "script 2", "script 3"] }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini baby script error:", error);
    res.json({
      scripts: [
        `Goo goo gaga! Choo-choo! Welcome to my 1st Birthday party! Come eat cake with me and dance all day!`,
        `Guess who is turning ONE? Me! All aboard my magical train for cake, hugs, and big smiles!`,
        `Hehehe! Peekaboo! Today is my special celebration day, don't forget to bring lots of balloons!`
      ]
    });
  }
});

// AI Baby Voice Synthesizer via Gemini 3.8 Flash Lite TTS
app.post("/api/gemini/generate-baby-voice", async (req, res) => {
  try {
    const {
      script,
      expression = "cheerful",
      tone = "playful_toddler",
      pitch = 1.35,
      intensity = 85,
      speed = 1.05,
      childName = "Baby",
      gender = "girl"
    } = req.body;

    if (!script || typeof script !== "string" || script.trim().length === 0) {
      return res.status(400).json({ error: "Script is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: false,
        fallbackToClientSynth: true,
        message: "Gemini API key not configured, using high-definition Web Audio DSP baby synthesizer."
      });
    }

    const ai = getAI();

    // Select voice personality and style instructions
    const voiceName = gender === "boy" ? "Puck" : "Kore";
    const styleDescriptions: Record<string, string> = {
      funny: "Silly, humorous, squeaky and playful toddler baby voice, laughing, mischievous tone, full of adorable energy",
      cheerful: "Joyful, sunny, bright, upbeat 1-year-old baby toddler voice, cheerful smiles, sweet cute tones",
      excited: "Super excited, enthusiastic, bouncy, energetic baby voice, eager, thrilled party conductor shouting with delight",
      cute_sweet: "Very sweet, tender, gentle baby cooing and innocent toddler voice, heartwarming, soft and cuddly",
      royal_prince_princess: "Cute dignified little prince/princess toddler voice, charming, proud, playful royalty",
      giggle_laugh: "Giggling, bubbling with infectious toddler laughter, cheerful chuckles, playful giggles throughout"
    };

    const chosenStyle = styleDescriptions[expression] || styleDescriptions.cheerful;
    const toneNote = tone === "tiny_newborn" ? "Extra tiny high pitch cooing" : tone === "animated_cartoon" ? "Animated cartoon baby character" : "Playful sweet toddler";

    const speechPrompt = `${chosenStyle}. ${toneNote}. Adorable pronunciation, baby excitement level ${intensity}%.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: script.trim(),
              speechMetadata: {
                style: speechPrompt,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.json({
        success: false,
        fallbackToClientSynth: true,
        message: "No audio stream returned from Gemini TTS, falling back to Web Audio DSP."
      });
    }

    // Gemini outputs 24kHz raw PCM. Ensure a valid 44-byte 24000 Hz 16-bit mono WAV header is present.
    const rawPcm = Buffer.from(base64Audio, "base64");
    let wavBuffer = rawPcm;

    if (rawPcm.length < 4 || rawPcm.toString("utf8", 0, 4) !== "RIFF") {
      const sampleRate = 24000;
      const numChannels = 1;
      const bitDepth = 16;
      const dataLength = rawPcm.length;
      const header = Buffer.alloc(44);

      header.write("RIFF", 0);
      header.writeUInt32LE(36 + dataLength, 4);
      header.write("WAVE", 8);
      header.write("fmt ", 12);
      header.writeUInt32LE(16, 16); // SubChunk1Size for PCM
      header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
      header.writeUInt16LE(numChannels, 22);
      header.writeUInt32LE(sampleRate, 24);
      header.writeUInt32LE(sampleRate * numChannels * (bitDepth / 8), 28); // ByteRate
      header.writeUInt16LE(numChannels * (bitDepth / 8), 32); // BlockAlign
      header.writeUInt16LE(bitDepth, 34); // BitsPerSample
      header.write("data", 36);
      header.writeUInt32LE(dataLength, 40);

      wavBuffer = Buffer.concat([header, rawPcm]);
    }

    const wavBase64 = wavBuffer.toString("base64");
    const audioDataUrl = `data:audio/wav;base64,${wavBase64}`;

    return res.json({
      success: true,
      audioDataUrl: audioDataUrl,
      audioBase64: wavBase64,
      sampleRate: 24000,
      mimeType: "audio/wav"
    });
  } catch (error: any) {
    console.error("Gemini Baby Voice generation error:", error);
    return res.json({
      success: false,
      fallbackToClientSynth: true,
      message: error?.message || "Failed to generate via Gemini TTS, falling back to Web Audio DSP."
    });
  }
});


// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`3D Birthday Video Animator running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
