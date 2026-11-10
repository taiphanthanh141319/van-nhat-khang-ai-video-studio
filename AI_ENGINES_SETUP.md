# Tich hop cac dong co AI ma nguon mo

Ban nay them lop dieu phoi ComfyUI vao Vạn Nhật Khang AI Studio. FLUX, Stable Diffusion, Wan2.1 va LTX-Video chay duoi dang workflow/model trong ComfyUI; chung khong chay trong Cloudflare Worker.

## Thanh phan va giay phep can xac minh

- ComfyUI: GPL-3.0 — https://github.com/Comfy-Org/ComfyUI
- FLUX.1 schnell: Apache-2.0 theo trang model — https://huggingface.co/black-forest-labs/FLUX.1-schnell
- Stable Diffusion: giay phep tuy phien ban model. SD 1.5, SDXL va checkpoint cong dong co dieu khoan khac nhau; kiem tra model card truoc khi dung thuong mai.
- Wan2.1: Apache-2.0 — https://github.com/Wan-Video/Wan2.1
- LTX-Video: kiem tra giay phep ma nguon/model theo dung phien ban — https://github.com/Lightricks/LTX-Video
- FFmpeg (hau ky, khong phai model AI): LGPL/GPL tuy cau hinh build va codec — https://ffmpeg.org/legal.html

Ma nguon mo hoac trong so mo khong dong nghia voi khong ton chi phi GPU, luu tru, dien hoac bang thong.

## 1. Cai ComfyUI

Theo huong dan chinh thuc: https://docs.comfy.org/installation

Khoi chay ComfyUI tren may co GPU. Mac dinh API o cong 8188. Khong mo cong nay truc tiep ra Internet.

## 2. Cai model/workflow

Tai model tu trang chinh thuc/model card tuong ung va dat vao thu muc theo huong dan ComfyUI. Cai custom nodes can thiet cho Wan2.1/LTX va video combine neu workflow yeu cau.

Studio nhan workflow o dinh dang API format: trong ComfyUI dung Save (API Format), khong dung workflow JSON giao dien thong thuong. Tao workflow rieng cho FLUX.1 schnell, Stable Diffusion/SDXL, Wan2.1 T2V/I2V va LTX-Video T2V/I2V.

## 3. Ket noi an toan qua Cloudflare

Tao Cloudflare Tunnel tu may chay ComfyUI toi http://127.0.0.1:8188. Bao ve hostname bang Cloudflare Access/service token hoac co che xac thuc tuong duong. Khong public ComfyUI khong xac thuc.

Trong Cloudflare Worker van-nhat-khang-ai-api, cau hinh:
- Variable COMFYUI_URL: URL HTTPS cua tunnel, khong co dau / cuoi.
- Secret COMFYUI_API_TOKEN: token xac thuc tunnel/backend neu da bat.
- Giu nguyen APP_ACCESS_TOKEN; khong dua token vao GitHub.

Sau do Deploy Worker. Studio goi /api/comfy/health, /api/comfy/queue, /api/comfy/history va /api/comfy/view qua Worker.

## 4. Dung trong Studio

Mo tab AI Engines:
1. Kiem tra ket noi.
2. Chon engine (FLUX, Stable Diffusion, Wan2.1 hoac LTX-Video).
3. Dan workflow API JSON da luu tu ComfyUI.
4. Gui tac vu, luu prompt_id.
5. Kiem tra trang thai; khi hoan thanh, xem/tai output tu lich su.

Dau ra phu thuoc workflow, model, custom nodes va GPU tren may chu.

## 5. FFmpeg

FFmpeg khong phai model AI va khong chay trong Cloudflare Worker. Dung FFmpeg tren may render/container rieng de ghep clip, am thanh, SRT va xuat MP4. Kiem tra giay phep build/codec cua ban FFmpeg phan phoi. Khong tai file nguoi dung len dich vu render neu chua thong bao va co dong y ro rang.

## Gioi han

- Khong bao gom trong so model vi dung luong lon va dieu khoan phan phoi khac nhau.
- Khong tu tai custom nodes/model tu nguon khong xac minh.
- Khong the tao video neu chua co GPU/backend ComfyUI dang chay.
- Worker chi dieu phoi; khong cung cap GPU mien phi.
