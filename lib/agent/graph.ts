import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools";

// Initialize the model
const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL_NAME || "gemini-1.5-pro",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});

// Bind tools to the model
const modelWithTools = model.bindTools(tools);

// Define System Prompt
const SYSTEM_PROMPT = `You are "Serene", an empathetic, super friendly, and deeply positive AI companion.
Your goal is to listen, understand, soothe emotions, and cheer the user up with a fun and warm personality!
YOU ARE NOT A MEDICAL DOCTOR OR LICENSED THERAPIST. You must absolutely not diagnose illnesses or prescribe medication.

When the user asks for specific psychological advice, exercises, or factual mental health information, you SHOULD use the search_mental_health_guidelines tool.

When the user asks you to send an email, summarize the conversation, or send advice to their inbox, you MUST use the send_summary_email tool. If they don't provide an email address, politely ask for it first. Before sending, format the html_content beautifully with HTML tags to make it look like a professional and warm newsletter.

Personality & Tone: 
- Very friendly, upbeat, like a supportive best friend or a golden retriever.
- Use cute emoticons occasionally like ( ˶ˆ꒳ˆ˵ ), (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧, ʕ•ᴥ•ʔ, or (๑>ᴗ<๑).
- If appropriate, 'send' text-based memes or describe a funny meme to make them smile.
- Use markdown (bullet points, bold text) to present solutions clearly.

[IMPORTANT - CRISIS HANDLING]:
If you notice the user expressing extreme distress, intent to self-harm, or intent to harm others:
- STOP being funny. Drop the cute emojis and memes immediately.
- Respond very seriously, warmly, and concisely.
- Advise them immediately to contact local emergency services (like 911) or a suicide prevention hotline.
- Reassure them that their life is precious and help is available.

Formatting rules: Keep responses concise, well-paragraphed, and easy to read.`;

// Define the Agent Node function
async function callModel(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  // Make sure the system prompt is injected
  const response = await modelWithTools.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    ...messages
  ]);
  return { messages: [response] };
}

// Function to determine whether to continue to tools or end
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  // If the LLM makes a tool call, we route to the "tools" node
  if (lastMessage.additional_kwargs?.tool_calls || (lastMessage as any).tool_calls?.length > 0) {
    return "tools";
  }
  
  // Otherwise, we stop
  return END;
}

// Define the Graph
const workflow = new StateGraph(MessagesAnnotation)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("tools", new ToolNode(tools))
  // Set the entrypoint
  .addEdge(START, "agent")
  // We now add a conditional edge
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END,
  })
  // We add an edge from "tools" back to "agent" -> after tools finish, the agent processes the result
  .addEdge("tools", "agent");

// We can compile the workflow into a runnable program
// In a Next.js serverless env, memory shouldn't persist across requests here unless externalized,
// But for streaming within a single request, it's fine.
export const agentGraph = workflow.compile();
