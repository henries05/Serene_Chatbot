import { agentGraph } from "@/lib/agent/graph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[DEBUG] Raw Request Body:", JSON.stringify(body, null, 2));
    
    const { messages } = body; 

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid or empty messages array." }), { status: 400 });
    }

    // Limit context window to the last 40 Q&A pairs (80 messages)
    const MAX_MESSAGES = 80;
    const truncatedMessages = messages.slice(-MAX_MESSAGES);

    // Convert UI messages to LangChain Message format
    const langChainMessages = truncatedMessages.map((msg: any) => {
      if (msg.role === 'assistant' || msg.role === 'model') {
        return new AIMessage(msg.content);
      }
      return new HumanMessage(msg.content);
    });

    const stream = new ReadableStream({
      async start(controller) {
        let hasSentData = false;
        try {
          const streamData = await agentGraph.stream(
            { messages: langChainMessages },
            { streamMode: "messages", version: "v2" }
          );

          for await (const chunk of streamData) {
            const [messageChunk, metadata] = chunk;
            if (metadata?.langgraph_node === "agent" && messageChunk?.content) {
              controller.enqueue(new TextEncoder().encode(messageChunk.content));
              hasSentData = true;
            }
          }
          controller.close();
        } catch (streamError: any) {
          console.error("[DEBUG] Streaming error encountered:", streamError);
          if (!hasSentData) {
            const errString = String(streamError?.message || "") + JSON.stringify(streamError || {});
            let fallbackMsg = "Xin lỗi bạn, Serene vừa gặp một chút sự cố kỹ thuật khi kết nối với máy chủ AI. 🐶🔌 Bạn thử gửi lại tin nhắn giúp mình nhé!";
            
            if (streamError?.status === 429 || errString.includes("429") || errString.includes("Too Many Requests") || errString.includes("Quota")) {
              fallbackMsg = "Huhu, mình vừa bị Google 'phạt' vì chat quá nhanh (Vượt giới hạn 15 tin nhắn/phút của tài khoản miễn phí). 🐶💤 Bạn chờ giúp mình khoảng 1 phút rồi hẵng chat tiếp nhé!";
            }

            controller.enqueue(new TextEncoder().encode(fallbackMsg));
            controller.close();
          } else {
            // If partially sent, just close gracefully
            controller.close();
          }
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
    console.error("[DEBUG] Full Error Object from LangGraph API:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    const errString = String(error?.message || "") + JSON.stringify(error || {});
    
    if (error?.status === 429 || error?.code === 429 || errString.includes("429")) {
      return new Response(JSON.stringify({ 
        error: "Google AI rate limit reached (429 Too Many Requests). The AI is currently taking a quick nap! 🐶💤 Please wait about 1 minute and try again!" 
      }), { status: 429 });
    }

    return new Response(JSON.stringify({ error: "Connection to AI failed. Please try again later." }), { status: 500 });
  }
}
