# Kích hoạt AI Backend (Cloudflare Workers)

Website GitHub Pages chỉ phục vụ giao diện. Hai khóa bí mật phải được lưu trong Cloudflare Worker, không đặt trong app.js, index.html hoặc GitHub.

## 1. Cập nhật Worker đang dùng
Worker hiện tại của dự án: `van-nhat-khang-ai-api`.

1. Mở https://dash.cloudflare.com/
2. Chọn **Workers & Pages** → mở Worker **van-nhat-khang-ai-api**.
3. Chọn **Edit code**.
4. Thay toàn bộ mã hiện tại bằng nội dung tệp `worker.js` trong repository GitHub.
5. Nhấn **Deploy**.

Không tạo Worker mới nếu Worker hiện tại đã có URL đang dùng trong Studio.

## 2. Cấu hình Secrets
Trong Worker → **Settings → Variables and Secrets**:

- `APP_ACCESS_TOKEN`: giữ Secret đang tồn tại. Giá trị phải trùng mã truy cập nhập trong AI Studio. Nếu mã cũ từng bị lộ, hãy thay bằng chuỗi ngẫu nhiên mới và cập nhật lại trong Studio.
- `OPENAI_API_KEY`: thêm Secret mới bằng API key của tài khoản OpenAI Platform. Tạo/lấy khóa tại https://platform.openai.com/api-keys. Không gửi khóa này vào ChatGPT, không đặt trong GitHub hoặc website.

Nếu `APP_ACCESS_TOKEN` đã tồn tại, không tạo biến trùng tên; hãy chỉnh sửa Secret đó khi cần. Sau khi thêm/sửa Secret, Deploy Worker.

## 3. Kết nối trong Studio
Mở https://taiphanthanh141319.github.io/van-nhat-khang-ai-video-studio/ → tab **AI Studio**:
- Worker API URL: `https://van-nhat-khang-ai-api.taiphanthanh141319.workers.dev`
- Mã truy cập ứng dụng: giá trị hiện tại của Secret `APP_ACCESS_TOKEN`

Nhấn **Kiểm tra kết nối**. Sau khi GitHub Pages cập nhật, tải lại trang bằng Ctrl+F5.

## API được hỗ trợ
- `GET /api/health` — kiểm tra Worker.
- `POST /api/script` — tạo kịch bản.
- `POST /api/image` — tạo ảnh PNG.
- `POST /api/speech` — tạo giọng đọc MP3.
- `POST /api/transcribe` — nhận dạng tiếng Việt từ tệp audio/video tối đa 24 MB.

## Chi phí và giới hạn
Các API trên sử dụng OpenAI API và có thể phát sinh phí. Tài khoản API cần có billing/quyền truy cập model phù hợp. Worker mẫu chưa có tài khoản riêng cho từng người dùng, quota người dùng hoặc hàng đợi tác vụ dài.

## Chưa triển khai trong bản này
- Sinh video chuyển động từ prompt bằng nhà cung cấp video AI.
- Ghép/cắt nhiều clip và render MP4 tự động bằng FFmpeg.
- Tự động tải video gốc lên máy chủ.

Các phần này cần dịch vụ video AI và hạ tầng render/lưu trữ riêng; giao diện không giả lập rằng chúng đã hoạt động.


## 4. Kết nối ComfyUI và các model mã nguồn mở

Để bật tab AI Engines, cần có máy GPU chạy ComfyUI và Cloudflare Tunnel bảo vệ bằng Cloudflare Access.

Trong Worker van-nhat-khang-ai-api, thêm:
- Variable COMFYUI_URL: URL HTTPS của hostname tunnel trỏ tới ComfyUI.
- Secret COMFYUI_ACCESS_CLIENT_ID: Client ID của Cloudflare Access Service Token.
- Secret COMFYUI_ACCESS_CLIENT_SECRET: Client Secret tương ứng.

Có thể dùng COMFYUI_API_TOKEN nếu backend ComfyUI có lớp Bearer token riêng. Không bật public access không xác thực cho cổng ComfyUI.

Sau khi cấu hình, Deploy Worker và vào tab AI Engines để kiểm tra. Các endpoint proxy:
- GET /api/comfy/health
- POST /api/comfy/queue
- GET /api/comfy/history?prompt_id=...
- GET /api/comfy/view?filename=...&subfolder=...&type=...

Workflow cần xuất từ ComfyUI bằng Save (API Format). Model FLUX, Stable Diffusion, Wan2.1 và LTX-Video phải được cài trên máy GPU. Hướng dẫn đầy đủ tại AI_ENGINES_SETUP.md.

Lưu ý: Worker không cài hoặc chạy model, không có GPU và không render video. FFmpeg cần chạy trên máy render/container riêng. Không phát sinh thay đổi Secret hiện tại khi chưa được cấu hình thủ công.
