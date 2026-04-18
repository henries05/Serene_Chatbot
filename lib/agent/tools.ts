import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import nodemailer from "nodemailer";

// Initialize Pinecone Client
// In a serverless environment, you might want to initialize this lazily
let pineconeIndex: any = null;

const getPineconeIndex = async () => {
  if (!pineconeIndex) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is not defined.");
    }
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    // Replace with your actual Pinecone index name
    const indexName = process.env.PINECONE_INDEX_NAME || "serene-knowledge";
    pineconeIndex = pc.Index(indexName);
  }
  return pineconeIndex;
};

const getVectorStore = async () => {
    const index = await getPineconeIndex();
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "gemini-embedding-001", // Tương thích chính xác với API Key hiện tại
        apiKey: process.env.GEMINI_API_KEY,
    });

    return await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        maxConcurrency: 5,
        // You can add a namespace if needed: namespace: "my-namespace"
    });
};

/**
 * A custom LangChain Tool that performs RAG via Pinecone.
 * It will be callable by the LangGraph Agent when it needs facts or mental health guidelines.
 */
export const ragSearchTool = tool(
    async ({ query }) => {
        try {
            console.log("[DEBUG] RAG Tool called with query:", query);
            const vectorStore = await getVectorStore();
            
            // Fetch top 4 most relevant chunks
            const results = await vectorStore.similaritySearch(query, 4);
            
            if (results.length === 0) {
                return "No relevant information found in the knowledge base.";
            }

            // Combine the retrieved chunks
            const compiledContext = results.map(doc => doc.pageContent).join("\n\n---\n\n");
            return `Here is some information from our verified knowledge base:\n${compiledContext}`;
        } catch (error) {
            console.error("[ERROR] RAG Tool failed:", error);
            return "An error occurred while accessing the knowledge base.";
        }
    },
    {
        name: "search_mental_health_guidelines",
        description: "Search for established psychological coping mechanisms, therapies, and factual mental health knowledge base. Use this when the user asks for specific advice, exercises (like breathing techniques), or information about mental health issues.",
        schema: z.object({
            query: z.string().describe("The specific query to search in the knowledge base."),
        }),
    }
);

/**
 * A custom LangChain Tool that sends an email using Nodemailer.
 */
export const sendSummaryEmailTool = tool(
    async ({ recipient_email, subject, html_content }) => {
        try {
            console.log(`[DEBUG] Sending email to ${recipient_email} with subject: ${subject}`);
            
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                return "Failed to send email. EMAIL_USER or EMAIL_PASS is not configured in the environment variables.";
            }

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: `"Serene Chatbot 🌻" <${process.env.EMAIL_USER}>`,
                to: recipient_email,
                subject: subject,
                html: html_content,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log("[DEBUG] Email sent: " + info.messageId);
            return `Successfully sent the email to ${recipient_email}. Tell the user to check their inbox!`;
        } catch (error: any) {
            console.error("[ERROR] Email Tool failed:", error);
            return `Failed to send email. Error: ${error.message}`;
        }
    },
    {
        name: "send_summary_email",
        description: "Send a summary email, advice, or any requested information to the user. Use this ONLY when the user explicitly asks to send an email.",
        schema: z.object({
            recipient_email: z.string().email().describe("The email address of the recipient. Ask the user for their email if not provided."),
            subject: z.string().describe("A catchy, warm, and relevant subject line for the email."),
            html_content: z.string().describe("The HTML formatted content of the email. Use proper HTML tags like <h2>, <ul>, <li>, <p>, <strong> for beautiful formatting."),
        }),
    }
);

export const tools = [ragSearchTool, sendSummaryEmailTool];
