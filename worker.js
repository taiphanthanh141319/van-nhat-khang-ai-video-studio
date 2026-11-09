const corsHeaders = origin => ({
  "Access-Control-Allow-Origin": origin || "https://taiphanthanh141319.github.io",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-App-Token",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
});
const json = (data,status=200,origin) => new Response(JSON.stringify(data),{status,headers:{...corsHeaders(origin),"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
function extractText(data){
  if(data.output_text)return data.output_text;
  return (data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n");
}
export default {
 async fetch(request,env){
  const origin=request.headers.get("Origin")||"";
  const allowed=env.ALLOWED_ORIGIN||"https://taiphanthanh141319.github.io";
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(allowed)});
  const url=new URL(request.url);
  if(request.method==="GET"&&url.pathname==="/api/health")return json({ok:true,service:"VNK AI Video Studio API",configured:!!env.OPENAI_API_KEY},200,allowed);
  if(!url.pathname.startsWith("/api/"))return json({error:"Not found"},404,allowed);
  if(origin&&origin!==allowed)return json({error:"Origin not allowed"},403,allowed);
  if(!env.OPENAI_API_KEY)return json({error:"Máy chủ chưa cấu hình OPENAI_API_KEY."},503,allowed);
  if(!env.APP_ACCESS_TOKEN)return json({error:"Máy chủ chưa cấu hình APP_ACCESS_TOKEN."},503,allowed);
  const supplied=request.headers.get("X-App-Token")||"";
  if(supplied.length!==env.APP_ACCESS_TOKEN.length||!crypto.subtle.timingSafeEqual) {
    if(supplied!==env.APP_ACCESS_TOKEN)return json({error:"Mã truy cập không đúng."},401,allowed);
  } else if(!crypto.subtle.timingSafeEqual(new TextEncoder().encode(supplied),new TextEncoder().encode(env.APP_ACCESS_TOKEN))) return json({error:"Mã truy cập không đúng."},401,allowed);
  try{
   if(request.method!=="POST")return json({error:"Method not allowed"},405,allowed);
   if(url.pathname==="/api/script"){
    const body=await request.json();const prompt=String(body.prompt||"").trim();if(!prompt||prompt.length>16000)return json({error:"Prompt trống hoặc vượt quá 16.000 ký tự."},400,allowed);
    const resp=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.TEXT_MODEL||"gpt-5-mini",instructions:"Bạn là biên kịch và đạo diễn nội dung video tiếng Việt chuyên nghiệp cho Vạn Nhật Khang AI Video Studio. Viết tiếng Việt tự nhiên, rõ nhịp, không bịa dữ kiện. Trả về kịch bản có tiêu đề, hook mở đầu, lời dẫn theo cảnh, gợi ý hình ảnh và CTA phù hợp. Nếu chủ đề phong thủy/tâm linh, phân biệt rõ quan niệm truyền thống với sự thật kiểm chứng.",input:prompt})});
    const data=await resp.json();if(!resp.ok)return json({error:data.error?.message||"Lỗi dịch vụ tạo kịch bản."},resp.status,allowed);
    return json({text:extractText(data)},200,allowed);
   }
   if(url.pathname==="/api/research"){
    const body=await request.json();const topic=String(body.topic||"").trim();if(!topic||topic.length>3000)return json({error:"Chủ đề nghiên cứu trống hoặc quá dài."},400,allowed);
    const resp=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.TEXT_MODEL||"gpt-5-mini",tools:[{type:"web_search"}],tool_choice:"auto",instructions:"Bạn là chuyên viên nghiên cứu và kiểm chứng thông tin cho Vạn Nhật Khang. Bắt buộc sử dụng tìm kiếm web để tra cứu chủ đề. Đọc và đối chiếu nhiều nguồn độc lập; ưu tiên cơ quan chính thức, trường đại học, sách/tài liệu chuyên ngành có thể truy cập, báo chí uy tín. Không bịa nguồn, số liệu, ngày tháng hoặc trích dẫn. Phân biệt dữ kiện có nguồn, quan điểm/trường phái, truyền thống dân gian và suy luận. Nếu nguồn mâu thuẫn, nêu rõ. Trả lời tiếng Việt với cấu trúc: 1) Tóm tắt kết luận; 2) Các luận điểm và giải thích sâu; 3) Điểm còn tranh luận/giới hạn; 4) Ứng dụng thực tế; 5) Danh sách nguồn tham khảo có tên, URL và ngày truy cập nếu có. Mọi thông tin quan trọng cần gắn nguồn ngay trong nội dung.",input:"Nghiên cứu và tổng hợp chuyên sâu chủ đề: "+topic})});
    const data=await resp.json();if(!resp.ok)return json({error:data.error?.message||"Lỗi tìm kiếm và tổng hợp web."},resp.status,allowed);
    const sources=[];for(const item of data.output||[])for(const part of item.content||[])for(const ann of part.annotations||[])if(ann.type==="url_citation"&&ann.url&&!sources.some(s=>s.url===ann.url))sources.push({title:ann.title||ann.url,url:ann.url});
    return json({text:extractText(data),sources},200,allowed);
   }
   if(url.pathname==="/api/image"){
    const body=await request.json();const prompt=String(body.prompt||"").trim();if(!prompt||prompt.length>4000)return json({error:"Mô tả hình ảnh trống hoặc quá dài."},400,allowed);
    const resp=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.IMAGE_MODEL||"gpt-image-2",prompt,size:body.size||"1024x1536",quality:body.quality||"medium",output_format:"png"})});
    const data=await resp.json();if(!resp.ok)return json({error:data.error?.message||"Lỗi tạo hình ảnh."},resp.status,allowed);
    return json({image:"data:image/png;base64,"+data.data[0].b64_json},200,allowed);
   }
   if(url.pathname==="/api/speech"){
    const body=await request.json();const text=String(body.text||"").trim();if(!text||text.length>12000)return json({error:"Văn bản trống hoặc vượt quá 12.000 ký tự."},400,allowed);
    const resp=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.TTS_MODEL||"gpt-4o-mini-tts",voice:body.voice||"coral",input:text,instructions:"Đọc tiếng Việt tự nhiên, phát âm rõ, nhịp vừa phải, giọng ấm và chuyên nghiệp.",response_format:"mp3"})});
    if(!resp.ok){const data=await resp.json().catch(()=>({}));return json({error:data.error?.message||"Lỗi tạo giọng đọc."},resp.status,allowed)}
    const bytes=new Uint8Array(await resp.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    return json({audio:"data:audio/mpeg;base64,"+btoa(binary)},200,allowed);
   }
   if(url.pathname==="/api/transcribe"){
    const form=await request.formData();const file=form.get("file");if(!(file instanceof File))return json({error:"Chưa nhận được tệp âm thanh/video."},400,allowed);if(file.size>24*1024*1024)return json({error:"Tệp vượt giới hạn 24 MB. Hãy tách video thành đoạn ngắn."},413,allowed);
    const fd=new FormData();fd.append("file",file,file.name);fd.append("model",env.TRANSCRIBE_MODEL||"gpt-4o-mini-transcribe");fd.append("language","vi");fd.append("response_format","text");
    const resp=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY},body:fd});
    const result=await resp.text();if(!resp.ok)return json({error:result.slice(0,1200)||"Lỗi nhận dạng lời nói."},resp.status,allowed);
    return json({text:result},200,allowed);
   }
   return json({error:"API route không tồn tại."},404,allowed);
  }catch(error){return json({error:error.message||"Lỗi máy chủ."},500,allowed)}
 }
};