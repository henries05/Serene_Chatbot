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
