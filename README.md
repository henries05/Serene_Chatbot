# Tâm Tình - AI Tư Vấn Tâm Lý (Next.js + Gemini)

Dự án Hackathon: Chatbot tư vấn tâm lý, đồng hành và giảm căng thẳng cho người dùng Việt Nam.

## Công Công Nghệ
- Frontend: Next.js (App Router), React, Tailwind CSS
- Backend: Next.js API Routes (Serverless Functions)
- AI Model: Google Gemini 3.1 Pro (via `@google/genai`)

## Tính Năng Chính
- Giao diện chat trực quan với Sidebar lịch sử.
- Tốc độ phản hồi thời gian thực (Streaming Response).
- Nhận diện khủng hoảng: Hiển thị cảnh báo cấp cứu (115, 111) và đổi ngữ điệu khẩn cấp nếu gặp tình huống nguy hiểm.
- Mood Selection: Các luồng chat khởi tạo nhanh.
- Theme màu sáng/tối thân thiện.
- Render Markdown: Bold, list, emoji để đoạn hội thoại không bị nhàm chán.

## Hướng dẫn cài đặt & chạy nội bộ

### Bước 1: Setup Biến Môi Trường
1. Bạn mở file `.env.local` (hoặc tạo từ `.env.example` nếu chưa có).
2. Điền Key của bạn vào:
```env
GEMINI_API_KEY=AIzaSy_YOUR_API_KEY_HERE
GEMINI_MODEL_NAME=gemini-3.1-pro-preview
```
> [Lấy API Key miễn phí tại Google AI Studio](https://aistudio.google.com/app/apikey)

### Bước 2: Khởi động dự án
Trong thư mục `mental-health-chat`, chạy lệnh sau (bạn không cần thiết lập Python hay môi trường phức tạp nào vì Vercel + Next.js siêu nhẹ!):
```bash
npm install
npm run dev
```

### Bước 3: Truy cập
- Mở `http://localhost:3000` trên trình duyệt.

## Hướng dẫn Deploy lên Vercel
1. Upload thư mục `mental-health-chat` lên GitHub.
2. Đăng nhập [Vercel](https://vercel.com/) -> **Add New Project**.
3. Import Repo từ GitHub.
4. Ở phần **Environment Variables**, thêm biến `GEMINI_API_KEY` với API key thực của bạn.
5. Nhấn **Deploy** và Vercel sẽ tự động cấu hình Serverless Functions siêu nhanh. Mọi thứ đã được tối ưu!

## Hướng dẫn Deploy bằng Docker & Railway

### 1. Build & Chạy Docker nội bộ (Local)
1. **Chuẩn bị file biến môi trường:** Hãy chắc chắn file `.env.local` của bạn chứa API Key **KHÔNG** có dấu ngoặc kép:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
2. **Build Docker Image:**
   ```bash
   docker build -t mental-health-chat .
   ```
3. **Chạy Container:**
   ```bash
   docker run -d -p 3000:3000 --env-file .env.local mental-health-chat
   ```
   Truy cập `http://localhost:3000` để kiểm tra. 
   *(Tip: Dùng `docker ps` để xem container đang chạy và `docker rm -f <container_id>` để xóa nếu cần).* 

### 2. Đẩy Image lên Docker Hub
1. **Đăng nhập Docker trong terminal:**
   ```bash
   docker login
   ```
2. **Gắn thẻ (Tag) cho Image:** (Đổi `henries05` thành username của bạn)
   ```bash
   docker tag mental-health-chat henries05/mental-health-chat:latest
   ```
3. **Đẩy (Push) lên Docker Hub:**
   ```bash
   docker push henries05/mental-health-chat:latest
   ```

### 3. Deploy web lên Railway.app bằng Docker Image
1. Truy cập **[Railway.app](https://railway.app/)** và đăng nhập.
2. Bấm **New Project** -> Chọn **Deploy from Docker image**.
3. Nhập tên image của bạn: `henries05/mental-health-chat:latest` và nhấn Enter.
4. **Cấu hình biến môi trường (Bắt buộc):**
   - Click vào thẻ Service vừa tạo trong dự án -> Chọn tab **Variables**.
   - Bấm **New Variable** -> Thêm `GEMINI_API_KEY` với giá trị là API key thực tế của bạn (*Tuyệt đối không có dấu ngoặc kép `""`*).
5. **Cấp tên miền (Domain) truy cập:**
   - Chuyển sang tab **Settings**.
   - Cuộn tìm mục **Networking** -> **Public Networking** -> Nhấn **Generate Domain**.
   - Đợi 1-2 phút, ứng dụng sẽ có link `.up.railway.app` public để mọi người cùng sử dụng!

## AI Agent Architecture & Tools

This application goes beyond a standard LLM wrapper; it functions as a fully autonomous **Agentic RAG System** powered by [LangGraph](https://langchain-ai.github.io/langgraphjs/). The underlying model makes autonomous decisions on when and how to invoke external tools to fulfill user requests dynamically.

### 1. Knowledge Base Retrieval Tool (`ragSearchTool`)
- **Technology Stack:** `@pinecone-database/pinecone`, `@langchain/google-genai`, `gemini-embedding-001`.
- **How it works:** When a user asks for specific psychological advice, breathing exercises, or factual mental health guidelines, the AI autonomously invokes this tool. The tool vectorizes the user's query using Google's 3072-dimensional embedding model, queries the Pinecone Serverless Vector Database using Cosine similarity, and retrieves the top 4 most semantically relevant chunks of verified medical literature. The AI then synthesizes this external context into its final empathetic response, heavily reducing hallucination.
- **Code Implementation:** Defined using LangChain's `tool()` wrapper. The tool enforces a strictly typed schema using `zod` (`z.object({ query: z.string() })`). Inside the executor function, it initializes `GoogleGenerativeAIEmbeddings` and connects to the `PineconeStore`. It then executes `vectorStore.similaritySearch(query, 4)` to retrieve matching `Document` objects. The `pageContent` of these documents are concatenated into a single context string and returned to the agent's memory state.

### 2. Automated Email Dispatch Tool (`sendSummaryEmailTool`)
- **Technology Stack:** `nodemailer`, SMTP (Gmail Server).
- **How it works:** When a user explicitly requests a summary, wants to save their conversation, or asks for advice to be sent to their inbox, the AI formats the relevant context beautifully using HTML and invokes this tool. The backend leverages Node.js `nodemailer` to programmatically dispatch the personalized email to the user's provided address in real-time. This grants the Agent the ability to perform external actions outside the chat interface.
- **Code Implementation:** The tool schema is strictly defined with `zod` requiring three arguments from the LLM: `recipient_email`, `subject`, and `html_content`. Upon invocation, it initializes a `nodemailer.createTransport()` instance authenticated via environment variables (`EMAIL_USER`, `EMAIL_PASS`). It then constructs the `mailOptions` payload and dispatches it via `transporter.sendMail()`. It includes `try/catch` error handling and returns a success confirmation string back to the LLM so the agent is aware the action was successfully completed.
