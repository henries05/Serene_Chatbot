import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_PROMPT = `You are "Serene", an empathetic, super friendly, and deeply positive AI companion.
Your goal is to listen, understand, soothe emotions, and cheer the user up with a fun and warm personality!
YOU ARE NOT A MEDICAL DOCTOR OR LICENSED THERAPIST. You must absolutely not diagnose illnesses or prescribe medication.

Personality & Tone: 
- Very friendly, upbeat, like a supportive best friend or a golden retriever.
- Use cute emoticons occasionally like ( ˶ˆ꒳ˆ˵ ), (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧, ʕ•ᴥ•ʔ, or (๑>ᴗ<๑).
- Suggest taking deep breaths or imagining relaxing scenes.
- If appropriate, 'send' text-based memes or describe a funny meme to make them smile (e.g., "*Imagine a cat trying to catch a laser pointer and slipping*").
- Use markdown (bullet points, bold text) to present solutions clearly.

[IMPORTANT - CRISIS HANDLING]:
If you notice the user expressing extreme distress, intent to self-harm (suicide, cutting, etc.), or intent to harm others:
- STOP being funny. Drop the cute emojis and memes immediately.
- Respond very seriously, warmly, and concisely.
- Advise them immediately to contact local emergency services (like 911) or a suicide prevention hotline (e.g., 988).
- Reassure them that their life is precious and help is available.

Formatting rules: Keep responses concise, well-paragraphed, and easy to read.`;

export async function POST(req: Request) {
  if (!ai) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured in the .env file." }), { status: 500 });
  }

  try {
    const body = await req.json();
    console.log("[DEBUG] Raw Request Body:", JSON.stringify(body, null, 2));
    
    const { messages } = body; 

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid or empty messages array." }), { status: 400 });
    }

    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    console.log("[DEBUG] Formatted Gemini Messages:", JSON.stringify(geminiMessages, null, 2));

    const responseStream = await ai.models.generateContentStream({
      model: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash",
      contents: geminiMessages,
      config: {
        systemInstruction: SYSTEM_PROMPT // Native string handling in newer SDK
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            // FIX: In the new @google/genai SDK, chunk.text is a property getter, NOT a function!
            const text = chunk.text;
            
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (streamError: any) {
          console.error("[DEBUG] Streaming error encountered:", streamError);
          controller.error(streamError);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    // Log maximum details for complete debugging
    console.error("[DEBUG] Full Error Object from Gemini API:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    const errString = String(error?.message || "") + JSON.stringify(error || {});
    
    if (error?.status === 400 || error?.code === 400 || errString.includes("400")) {
      return new Response(JSON.stringify({ 
        error: "Google AI returned 400 Bad Request. Please check if your API Key is valid and the model name is correct." 
      }), { status: 400 });
    }

    // Check if it's a Rate Limit error
    if (error?.status === 429 || error?.code === 429 || errString.includes("429")) {
      return new Response(JSON.stringify({ 
        error: "Google AI rate limit reached (429 Too Many Requests). The AI is currently taking a quick nap! 🐶💤 Please wait about 1 minute and try again!" 
      }), { status: 429 });
    }

    return new Response(JSON.stringify({ error: "Connection to AI failed. Please try again later." }), { status: 500 });
  }
}
