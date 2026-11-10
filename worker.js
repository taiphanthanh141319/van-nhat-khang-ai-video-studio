const DEFAULT_ORIGIN = "https://taiphanthanh141319.github.io";

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || DEFAULT_ORIGIN)
    .split(",").map(v => v.trim()).filter(Boolean);
}
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || DEFAULT_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-App-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status = 200, origin = DEFAULT_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
function extractText(data) {
  if (typeof data.output_text === "string" && data.output_text) return data.output_text;
  return (data.output || []).flatMap(item => item.content || [])
    .filter(part => part.type === "output_text")
    .map(part => part.text || "")
    .join("\n");
}
function extractSources(data) {
  const sources = [];
  const add = (title, url) => {
    if (url && /^https?:\/\//i.test(url) && !sources.some(item => item.url === url)) {
      sources.push({ title: title || url, url });
    }
  };
  for (const item of data.output || []) {
    if (item.type === "web_search_call") {
      for (const source of (item.action && item.action.sources) || []) add(source.title, source.url);
    }
    for (const part of item.content || []) {
      for (const annotation of part.annotations || []) {
        if (annotation.type === "url_citation") add(annotation.title, annotation.url);
      }
    }
  }
  return sources;
}
function safeTokenEqual(received, expected) {
  const a = String(received || "");
  const b = String(expected || "");
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
async function readJson(request) {
  try { return await request.json(); }
  catch { throw new Error("Dữ liệu gửi lên không phải JSON hợp lệ."); }
}
async function callResponsesAPI(env, payload) {
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return { ok: false, status: 502, message: "Không kết nối được OpenAI API: " + (error.message || "Lỗi mạng") };
  }
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { data = { error: { message: raw.slice(0, 1000) || "OpenAI trả dữ liệu không hợp lệ." } }; }
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: data.error && data.error.message || "OpenAI API trả lỗi HTTP " + response.status,
      code: data.error && data.error.code || null,
      type: data.error && data.error.type || null
    };
  }
  return { ok: true, data };
}
function providerError(result, origin, fallback) {
  return json({
    error: result.message || fallback,
    provider: "OpenAI",
    providerStatus: result.status || 502,
    providerCode: result.code || null,
    providerType: result.type || null
  }, result.status || 502, origin);
}
async function openAIJsonEndpoint(env, path, body) {
  const response = await fetch("https://api.openai.com" + path, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + env.OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { data = {}; }
  return { response, data, raw };
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("Origin") || "";
    const origins = allowedOrigins(env);
    const originAllowed = !requestOrigin || origins.includes(requestOrigin);
    const responseOrigin = originAllowed && requestOrigin
      ? requestOrigin
      : (origins[0] || DEFAULT_ORIGIN);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: originAllowed ? 204 : 403,
        headers: corsHeaders(responseOrigin)
      });
    }

    if (requestOrigin && !originAllowed) {
      return json({
        error: "Origin không được phép. Hãy thêm chính xác domain đang chạy ứng dụng vào ALLOWED_ORIGIN trên Cloudflare."
      }, 403, responseOrigin);
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        service: "Vạn Nhật Khang AI Video Studio",
        version: "2.1.0",
        configured: {
          openai: !!env.OPENAI_API_KEY,
          accessToken: !!env.APP_ACCESS_TOKEN
        }
      }, 200, responseOrigin);
    }

    if (!url.pathname.startsWith("/api/")) {
      return json({ error: "API endpoint không tồn tại." }, 404, responseOrigin);
    }
    if (request.method !== "POST") {
      return json({ error: "Phương thức không được hỗ trợ." }, 405, responseOrigin);
    }
    if (!env.APP_ACCESS_TOKEN) {
      return json({ error: "Cloudflare chưa cấu hình Secret APP_ACCESS_TOKEN." }, 503, responseOrigin);
    }
    const suppliedToken = request.headers.get("X-App-Token") || "";
    if (!safeTokenEqual(suppliedToken, env.APP_ACCESS_TOKEN)) {
      return json({
        error: "Mã truy cập không hợp lệ. APP_ACCESS_TOKEN trong ứng dụng phải trùng hoàn toàn với Secret trên Cloudflare."
      }, 401, responseOrigin);
    }
    // ComfyUI proxy: secrets and private origin remain in Worker configuration.
    if (url.pathname.startsWith("/api/comfy/")) {
      const base = String(env.COMFYUI_URL || "").trim().replace(/\/+$/, "");
      if (!base || !/^https:\/\//i.test(base)) {
        return json({ error: "Chưa cấu hình COMFYUI_URL dạng HTTPS trong Worker." }, 503, responseOrigin);
      }
      const headers = { "Content-Type": "application/json" };
      if (env.COMFYUI_ACCESS_CLIENT_ID && env.COMFYUI_ACCESS_CLIENT_SECRET) {
        headers["CF-Access-Client-Id"] = env.COMFYUI_ACCESS_CLIENT_ID;
        headers["CF-Access-Client-Secret"] = env.COMFYUI_ACCESS_CLIENT_SECRET;
      }
      if (env.COMFYUI_API_TOKEN) headers["Authorization"] = "Bearer " + env.COMFYUI_API_TOKEN;

      if (url.pathname === "/api/comfy/health" && request.method === "GET") {
        const upstream = await fetch(base + "/system_stats", { headers });
        if (!upstream.ok) return json({ ok: false, message: "ComfyUI phản hồi HTTP " + upstream.status }, 502, responseOrigin);
        const stats = await upstream.json();
        return json({ ok: true, message: "Đã kết nối ComfyUI.", system: stats }, 200, responseOrigin);
      }

      if (url.pathname === "/api/comfy/queue" && request.method === "POST") {
        const body = await readJson(request);
        if (!body.workflow || typeof body.workflow !== "object" || Array.isArray(body.workflow)) {
          return json({ error: "Workflow phải là JSON object ở định dạng ComfyUI API." }, 400, responseOrigin);
        }
        const engine = String(body.engine || "");
        if (!["flux", "sd", "wan", "ltx"].includes(engine)) {
          return json({ error: "Engine không được hỗ trợ." }, 400, responseOrigin);
        }
        const upstream = await fetch(base + "/prompt", {
          method: "POST",
          headers,
          body: JSON.stringify({ prompt: body.workflow })
        });
        const raw = await upstream.text();
        let data = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch {}
        if (!upstream.ok) return json({ error: data.error && data.error.message || data.error || "ComfyUI queue HTTP " + upstream.status, details: data }, 502, responseOrigin);
        if (!data.prompt_id) return json({ error: "ComfyUI không trả prompt_id.", details: data }, 502, responseOrigin);
        return json({ prompt_id: data.prompt_id, number: data.number, engine }, 200, responseOrigin);
      }

      if (url.pathname === "/api/comfy/history" && request.method === "GET") {
        const id = String(url.searchParams.get("prompt_id") || "");
        if (!/^[a-zA-Z0-9-]{8,100}$/.test(id)) return json({ error: "prompt_id không hợp lệ." }, 400, responseOrigin);
        const upstream = await fetch(base + "/history/" + encodeURIComponent(id), { headers: { ...headers, "Content-Type": "application/json" } });
        const raw = await upstream.text();
        if (!upstream.ok) return json({ error: "Không đọc được lịch sử ComfyUI: HTTP " + upstream.status }, 502, responseOrigin);
        let data = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch { return json({ error: "ComfyUI trả lịch sử không hợp lệ." }, 502, responseOrigin); }
        return json({ history: data }, 200, responseOrigin);
      }

      if (url.pathname === "/api/comfy/view" && request.method === "GET") {
        const filename = String(url.searchParams.get("filename") || "");
        const subfolder = String(url.searchParams.get("subfolder") || "");
        const type = String(url.searchParams.get("type") || "output");
        if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
          return json({ error: "Tên tệp output không hợp lệ." }, 400, responseOrigin);
        }
        if (subfolder.includes("..") || subfolder.startsWith("/") || subfolder.includes("\\")) {
          return json({ error: "Thư mục output không hợp lệ." }, 400, responseOrigin);
        }
        if (!["output", "temp", "input"].includes(type)) return json({ error: "Loại output không hợp lệ." }, 400, responseOrigin);
        const params = new URLSearchParams({ filename, subfolder, type });
        const upstream = await fetch(base + "/view?" + params.toString(), { headers });
        if (!upstream.ok) return json({ error: "Không tải được output ComfyUI: HTTP " + upstream.status }, 502, responseOrigin);
        const responseHeaders = {
          ...corsHeaders(responseOrigin),
          "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
          "Content-Disposition": "inline; filename*=UTF-8''" + encodeURIComponent(filename),
          "Cache-Control": "private, max-age=60"
        };
        return new Response(upstream.body, { status: 200, headers: responseHeaders });
      }
      return json({ error: "ComfyUI endpoint không tồn tại hoặc phương thức không hợp lệ." }, 404, responseOrigin);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: "Cloudflare chưa cấu hình Secret OPENAI_API_KEY." }, 503, responseOrigin);
    }

    try {
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          authenticated: true,
          openaiConfigured: true,
          service: "Vạn Nhật Khang AI Video Studio",
          version: "2.1.0"
        }, 200, responseOrigin);
      }

      if (url.pathname === "/api/script") {
        const body = await readJson(request);
        const prompt = String(body.prompt || "").trim();
        if (!prompt || prompt.length > 16000) {
          return json({ error: "Prompt trống hoặc vượt quá 16.000 ký tự." }, 400, responseOrigin);
        }
        const result = await callResponsesAPI(env, {
          model: env.TEXT_MODEL || "gpt-5-mini",
          instructions: "VAI TRÒ: Bạn là tổ biên kịch cấp cao, nhà nghiên cứu chuyên ngành, đạo diễn hình ảnh và script doctor của thương hiệu Vạn Nhật Khang. Tạo kịch bản hoàn chỉnh có thể đưa vào sản xuất, không phải dàn ý sơ sài. Trước khi viết, xác định người xem, mục tiêu, góc khai thác cụ thể và luận đề trung tâm. Mỗi luận điểm phải có khái niệm hoặc tiêu chí, giải thích cơ chế/logic, ví dụ cụ thể và cách áp dụng hoặc điều cần tránh. Mỗi cảnh phải có timecode liên tục, mục tiêu cảnh, hình ảnh/góc máy/chuyển động, lời thoại nguyên văn, chữ trên màn hình, âm thanh và nhịp dựng. Lời thoại là phần trọng tâm, viết thành câu hoàn chỉnh có thể đọc ngay, không thay bằng gạch đầu dòng. Không sáo rỗng, không lặp ý, không bịa số liệu, Can Chi, lịch ngày, cổ thư hay trích dẫn. Với Phong Thủy, Bát Tự, Tử Vi, Huyền Không, Kỳ Môn phải dùng đúng thuật ngữ và phân biệt trường phái, nguyên lý với quan niệm dân gian; không khẳng định điều chưa được kiểm chứng như sự thật khoa học. Nếu prompt có nội dung nghiên cứu hoặc nguồn tham khảo, bám sát nội dung đó và nêu rõ giới hạn. Viết tiếng Việt tự nhiên, sâu sắc, chuyên nghiệp; tốc độ lời thoại khoảng 130-150 từ/phút, thời lượng phải khớp lượng lời. Kết thúc bằng kết luận, CTA, ghi chú sản xuất và checklist kiểm chứng.",
          input: prompt
        });
        if (!result.ok) return providerError(result, responseOrigin, "Không tạo được kịch bản.");
        const text = extractText(result.data);
        if (!text) return json({ error: "OpenAI phản hồi thành công nhưng không có nội dung kịch bản." }, 502, responseOrigin);
        return json({ text }, 200, responseOrigin);
      }

      if (url.pathname === "/api/research") {
        const body = await readJson(request);
        const topic = String(body.topic || "").trim();
        if (!topic || topic.length > 3000) {
          return json({ error: "Chủ đề nghiên cứu trống hoặc vượt quá 3.000 ký tự." }, 400, responseOrigin);
        }
        const result = await callResponsesAPI(env, {
          model: env.RESEARCH_MODEL || env.TEXT_MODEL || "gpt-5-mini",
          tools: [{ type: "web_search", search_context_size: "medium" }],
          tool_choice: "required",
          include: ["web_search_call.action.sources"],
          instructions: "Bạn là chuyên viên nghiên cứu và kiểm chứng thông tin cho Vạn Nhật Khang. BẮT BUỘC sử dụng công cụ web_search để tra cứu Internet trước khi tổng hợp. Đối chiếu nhiều nguồn độc lập; ưu tiên cơ quan chính thức, trường đại học, sách và tài liệu chuyên ngành, báo chí uy tín. Không bịa nguồn, số liệu, ngày tháng hoặc trích dẫn. Phân biệt dữ kiện có nguồn, quan điểm/trường phái, truyền thống dân gian và suy luận. Nếu nguồn mâu thuẫn, nêu rõ điểm khác biệt và giới hạn. Viết tiếng Việt theo cấu trúc: 1) Tóm tắt kết luận; 2) Các luận điểm và giải thích sâu; 3) Điểm tranh luận/giới hạn; 4) Ứng dụng thực tế; 5) Nguồn tham khảo. Gắn trích dẫn vào nhận định có căn cứ.",
          input: "Tìm kiếm, đọc và đối chiếu nguồn trên Internet để nghiên cứu chuyên sâu chủ đề sau: " + topic
        });
        if (!result.ok) return providerError(result, responseOrigin, "Lỗi tìm kiếm và tổng hợp Web.");
        const text = extractText(result.data);
        const sources = extractSources(result.data);
        if (!text) {
          return json({
            error: "OpenAI không trả nội dung nghiên cứu. Hãy kiểm tra quyền sử dụng công cụ web_search hoặc model nghiên cứu."
          }, 502, responseOrigin);
        }
        return json({ text, sources }, 200, responseOrigin);
      }

      if (url.pathname === "/api/image") {
        const body = await readJson(request);
        const prompt = String(body.prompt || "").trim();
        if (!prompt || prompt.length > 4000) return json({ error: "Mô tả hình ảnh trống hoặc quá dài." }, 400, responseOrigin);
        const result = await openAIJsonEndpoint(env, "/v1/images/generations", {
          model: env.IMAGE_MODEL || "gpt-image-1",
          prompt,
          size: body.size || "1024x1536",
          quality: body.quality || "medium",
          output_format: "png"
        });
        if (!result.response.ok) {
          return json({ error: result.data.error && result.data.error.message || "Lỗi tạo hình ảnh HTTP " + result.response.status }, result.response.status, responseOrigin);
        }
        const imageData = result.data.data && result.data.data[0] && result.data.data[0].b64_json;
        if (!imageData) return json({ error: "OpenAI không trả dữ liệu ảnh." }, 502, responseOrigin);
        return json({ image: "data:image/png;base64," + imageData }, 200, responseOrigin);
      }

      if (url.pathname === "/api/speech") {
        const body = await readJson(request);
        const text = String(body.text || "").trim();
        if (!text || text.length > 12000) return json({ error: "Văn bản trống hoặc vượt quá 12.000 ký tự." }, 400, responseOrigin);
        const speechResponse = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { "Authorization": "Bearer " + env.OPENAI_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: env.TTS_MODEL || "gpt-4o-mini-tts",
            voice: body.voice || "coral",
            input: text,
            instructions: "Đọc tiếng Việt tự nhiên, phát âm rõ, nhịp vừa phải, giọng ấm và chuyên nghiệp.",
            response_format: "mp3"
          })
        });
        if (!speechResponse.ok) {
          const rawError = await speechResponse.text();
          let errorData = {};
          try { errorData = JSON.parse(rawError); } catch {}
          return json({ error: errorData.error && errorData.error.message || rawError.slice(0, 800) || "Lỗi tạo giọng đọc." }, speechResponse.status, responseOrigin);
        }
        const bytes = new Uint8Array(await speechResponse.arrayBuffer());
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return json({ audio: "data:audio/mpeg;base64," + btoa(binary) }, 200, responseOrigin);
      }

      if (url.pathname === "/api/transcribe") {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return json({ error: "Chưa nhận được tệp âm thanh/video." }, 400, responseOrigin);
        if (file.size > 24 * 1024 * 1024) return json({ error: "Tệp vượt giới hạn 24 MB. Hãy tách video thành đoạn ngắn." }, 413, responseOrigin);
        const formData = new FormData();
        formData.append("file", file, file.name || "audio-file");
        formData.append("model", env.TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
        formData.append("language", "vi");
        formData.append("response_format", "text");
        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { "Authorization": "Bearer " + env.OPENAI_API_KEY },
          body: formData
        });
        const transcription = await response.text();
        if (!response.ok) {
          let data = {};
          try { data = JSON.parse(transcription); } catch {}
          return json({ error: data.error && data.error.message || transcription.slice(0, 1000) || "Lỗi nhận dạng lời nói." }, response.status, responseOrigin);
        }
        return json({ text: transcription }, 200, responseOrigin);
      }

      return json({ error: "API endpoint không tồn tại." }, 404, responseOrigin);
    } catch (error) {
      return json({ error: error && error.message || "Lỗi máy chủ không xác định." }, 500, responseOrigin);
    }
  }
};