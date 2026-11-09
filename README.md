# Vạn Nhật Khang AI Video Studio

Studio web tiếng Việt hỗ trợ tổ chức quy trình sản xuất video: quản lý dự án, phát triển kịch bản, lập shot list, xem trước tư liệu video, biên tập phụ đề và chuẩn bị checklist hậu kỳ.

## Bản hiện tại có gì?

- **Tổng quan dự án:** tạo và chuyển đổi giữa các dự án.
- **Kịch bản:** lưu ý tưởng, lời thoại, thời lượng, tỷ lệ khung hình và phong cách hình ảnh.
- **Dàn ý mẫu:** tạo khung mở đầu – nội dung chính – kết thúc để tiếp tục biên tập.
- **Phân cảnh:** thêm, sửa, xóa shot list hoặc tự chia kịch bản thành các phân cảnh nháp.
- **Sao lưu & khôi phục:** xuất toàn bộ workspace dạng JSON và nhập lại bản sao lưu trên thiết bị.
- **Thư viện video:** chọn nhiều video từ thiết bị và xem trước ngay trong trình duyệt.
- **Phụ đề SRT:** nhập tệp SRT, tạo phụ đề nháp với thời gian ước tính từ kịch bản, kiểm tra định dạng cơ bản và tải phụ đề.
- **Hậu kỳ:** checklist rà soát đoạn thừa/lặp, âm thanh, phụ đề, khung đen/mờ và cấu hình đầu ra.
- **Xuất dữ liệu dự án:** tải thông tin dự án dạng JSON.
- **Lưu cục bộ:** dự án được lưu trong localStorage của trình duyệt trên thiết bị đang sử dụng.

## Chạy ứng dụng

Có thể mở `index.html` trực tiếp trong trình duyệt. Để có đường dẫn web công khai:

1. Mở repository trên GitHub.
2. Vào **Settings → Pages**.
3. Trong phần **Build and deployment**, chọn **Source: GitHub Actions**.
4. Workflow tại `.github/workflows/pages.yml` sẽ triển khai website sau khi chạy thành công.

Đường dẫn Pages dự kiến: https://taiphanthanh141319.github.io/van-nhat-khang-ai-video-studio/

## Giới hạn kỹ thuật hiện tại

Đây là bản frontend tĩnh. Các tính năng sau **chưa được tích hợp**: sinh video bằng mô hình AI, tạo giọng đọc AI, nhận dạng lời nói tự động, đồng bộ phụ đề tự động, xử lý âm thanh nâng cao và render MP4 bằng FFmpeg. Những chức năng này cần backend và/hoặc tài khoản API của nhà cung cấp phù hợp.

Video được chọn chỉ tạo URL xem trước trong trình duyệt; ứng dụng không tự tải video lên GitHub hay máy chủ. Dữ liệu dự án lưu trong trình duyệt có thể mất nếu người dùng xóa dữ liệu trang web, vì vậy hãy xuất JSON để sao lưu.

## Cấu trúc

- `index.html` — giao diện ứng dụng.
- `styles.css` — giao diện responsive.
- `app.js` — quản lý dự án, phân cảnh, video xem trước và phụ đề.
- `.github/workflows/pages.yml` — quy trình triển khai GitHub Pages.

---
**VẠN NHẬT KHANG**  
*Nâng Tầm Giá Trị – Kiến Tạo Phong Thuỷ – Phụng Sự Tâm Linh Việt*

## AI Studio và backend

Giao diện có thêm tab **AI Studio** để kết nối máy chủ AI:
- Tạo kịch bản tiếng Việt qua OpenAI Responses API.
- Tạo ảnh PNG qua Images API.
- Tạo giọng đọc MP3 qua Audio Speech API.
- Nhận dạng lời nói tiếng Việt từ tệp audio/video qua Audio Transcriptions API.

Để kích hoạt các chức năng này, làm theo hướng dẫn tại [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md). Backend Worker nằm ở `worker.js`; cấu hình mẫu ở `wrangler.toml`. API key nhà cung cấp và mã APP_ACCESS_TOKEN phải được đặt trong Cloudflare Worker Secrets, tuyệt đối không đưa vào GitHub hoặc trình duyệt.

**Chưa tích hợp:** tạo video chuyển động từ prompt và render MP4 nhiều clip bằng FFmpeg. Hai phần này cần nhà cung cấp video AI và máy chủ render riêng; không được giả lập là đã hoạt động.
