# Kích hoạt AI Backend (Cloudflare Workers)

Website GitHub Pages chỉ phục vụ giao diện tĩnh. API key không được đặt trong app.js, index.html hoặc GitHub.

## 1. Tạo Worker
1. Đăng nhập Cloudflare: https://dash.cloudflare.com/
2. Mở **Workers & Pages → Create → Worker**.
3. Đặt tên `van-nhat-khang-ai-video-studio-api`.
4. Deploy Worker trống, sau đó mở **Edit code** và thay nội dung bằng toàn bộ `worker.js` trong repository này.
5. Deploy lại. Ghi lại URL dạng `https://van-nhat-khang-ai-video-studio-api.<ten-tai-khoan>.workers.dev`.

## 2. Cấu hình Secrets
Trong Worker → **Settings → Variables and Secrets**, thêm hai secret:
- `OPENAI_API_KEY`: API key tạo trong OpenAI Platform. Không gửi key này vào ChatGPT hoặc nhập vào website.
- `APP_ACCESS_TOKEN`: tự tạo một mật khẩu dài, ngẫu nhiên, tối thiểu 24 ký tự. Đây là mã để website gọi Worker.

Giữ các biến mô hình và `ALLOWED_ORIGIN` theo cấu hình trong `wrangler.toml`. Nếu đổi tên miền Pages, cập nhật `ALLOWED_ORIGIN` đúng tên miền đó.

## 3. Kết nối trong Studio
Mở website → tab **AI Studio** → nhập URL Worker và APP_ACCESS_TOKEN → bấm **Kiểm tra kết nối**. Mã truy cập được giữ trong session của trình duyệt hiện tại; API key nhà cung cấp chỉ nằm trong Worker.

## API hiện có
- `GET /api/health` — kiểm tra máy chủ.
- `POST /api/script` — tạo kịch bản bằng Responses API.
- `POST /api/image` — tạo ảnh PNG.
- `POST /api/speech` — tạo giọng đọc MP3.
- `POST /api/transcribe` — nhận dạng lời nói tiếng Việt từ tệp âm thanh/video (tối đa 24 MB).

## Chi phí và giới hạn
Các lệnh gọi dùng OpenAI API và có thể phát sinh phí theo mức giá, model, dung lượng và tài khoản API của bạn. Cần bật thanh toán/được cấp quyền cho các model đã cấu hình. Có thể đổi model trong Worker Variables. Không chia sẻ APP_ACCESS_TOKEN công khai. Worker mẫu này chưa có hệ thống tài khoản người dùng, quota theo người dùng hoặc hàng đợi tác vụ dài.

## Những phần chưa bật
- Tạo video chuyển động bằng nhà cung cấp video AI: cần chọn nhà cung cấp, API và cấu hình billing riêng.
- Dựng MP4/ghép nhiều clip bằng FFmpeg: cần máy chủ render có thời gian chạy dài và lưu trữ tệp; Worker ngắn hạn không phù hợp để render video dài.
- Tự động tải tệp video gốc lên máy chủ: chưa bật; chỉ gửi tệp khi người dùng chủ động chọn chức năng nhận dạng lời nói.
