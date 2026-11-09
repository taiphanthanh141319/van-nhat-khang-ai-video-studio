const $=id=>document.getElementById(id);const STORE='vnk-ai-video-studio-v1';const sampleSrt='1\n00:00:00,000 --> 00:00:04,000\nChào mừng bạn đến với Vạn Nhật Khang.\n\n2\n00:00:04,000 --> 00:00:08,000\nCùng khám phá những ý tưởng sáng tạo hôm nay.';let state=loadState();let activeId=state.activeId;let mediaUrls=[];
function loadState(){try{const x=JSON.parse(localStorage.getItem(STORE));if(x&&Array.isArray(x.projects)&&x.projects.length)return x;}catch(e){}const p={id:makeId(),title:'Dự án video đầu tiên',duration:'60 giây',ratio:'9:16 · Video dọc',visualStyle:'Điện ảnh chân thực',idea:'',script:'',scenes:[]};return{activeId:p.id,projects:[p]};}
function makeId(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function project(){return state.projects.find(p=>p.id===activeId)||state.projects[0]}
function persist(){state.activeId=activeId;localStorage.setItem(STORE,JSON.stringify(state));renderProjects();updateStats()}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2300)}
function renderProjects(){$('projectList').innerHTML='';state.projects.forEach(p=>{const b=document.createElement('button');b.className='project-chip'+(p.id===activeId?' active':'');b.textContent='▸ '+p.title;b.onclick=()=>{saveForm();activeId=p.id;loadForm();persist();showView('dashboard')};$('projectList').append(b)});$('welcomeTitle').textContent=project().title}
function updateStats(){$('statProjects').textContent=state.projects.length;$('statScenes').textContent=project().scenes.length;$('statMedia').textContent=$('mediaGrid').querySelectorAll('video').length}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));
function loadForm(){const p=project();$('projectTitle').value=p.title;$('duration').value=p.duration;$('ratio').value=p.ratio;$('visualStyle').value=p.visualStyle;$('idea').value=p.idea;$('scriptText').value=p.script;renderScenes()}
function saveForm(){const p=project();if(!p)return;p.title=$('projectTitle').value.trim()||'Dự án chưa đặt tên';p.duration=$('duration').value;p.ratio=$('ratio').value;p.visualStyle=$('visualStyle').value;p.idea=$('idea').value;p.script=$('scriptText').value;persist()}
function newProject(){saveForm();const p={id:makeId(),title:'Dự án mới',duration:'60 giây',ratio:'9:16 · Video dọc',visualStyle:'Điện ảnh chân thực',idea:'',script:'',scenes:[]};state.projects.unshift(p);activeId=p.id;persist();loadForm();showView('script');toast('Đã tạo dự án mới')}
$('newProject').onclick=newProject;$('dashboardNew').onclick=newProject;
['projectTitle','duration','ratio','visualStyle','idea','scriptText'].forEach(id=>$(id).addEventListener('change',()=>{saveForm();$('welcomeTitle').textContent=project().title}));
$('saveScript').onclick=()=>{saveForm();toast('Đã lưu kịch bản trên thiết bị')};
function buildProfessionalPrompt(topic,p,researchText){
 return `VAI TRÒ: Bạn là biên kịch trưởng, biên tập viên chuyên ngành và đạo diễn video của Phong Thủy Và Đồ Thờ Vạn Nhật Khang.

ĐỀ BÀI CỤ THỂ:
${topic}

THÔNG SỐ:
- Thời lượng: ${p.duration||'60 giây'}
- Tỷ lệ: ${p.ratio||'9:16 · Video dọc'}
- Phong cách hình ảnh: ${p.visualStyle||'Điện ảnh chân thực'}
- Thương hiệu: Vạn Nhật Khang
- Ngôn ngữ: tiếng Việt tự nhiên, chuẩn thuật ngữ, đọc thành lời được.

${researchText?'TƯ LIỆU NGHIÊN CỨU WEB ĐƯỢC CUNG CẤP (ưu tiên làm căn cứ; không tự thêm dữ kiện ngoài nguồn; giữ URL và giới hạn nguồn):\\n'+researchText:'CHẾ ĐỘ KHÔNG CÓ NGHIÊN CỨU ĐÍNH KÈM: không tuyên bố đã tra cứu web; nếu cần dữ kiện cập nhật hoặc chuyên biệt thì ghi rõ điểm cần kiểm chứng.'}

YÊU CẦU BIÊN TẬP:
1. Chọn MỘT góc khai thác sắc nét cho đúng đề bài; không mở rộng lan man sang các chủ đề gần giống.
2. Nêu rõ người xem mục tiêu và điều họ sẽ hiểu/làm được sau video.
3. Có luận đề trung tâm và tối thiểu 3 luận điểm thực chất (với video ngắn thì cô đọng nhưng vẫn có giải thích).
4. Mỗi luận điểm phải có: khái niệm/tiêu chí cụ thể → giải thích cơ chế hoặc logic → ví dụ minh họa sát đời sống → cách áp dụng hoặc điều cần tránh.
5. Với nội dung Phong Thủy, Bát Tự, Tử Vi, Huyền Không Phi Tinh, Kỳ Môn Độn Giáp: sử dụng thuật ngữ chuyên môn chính xác; phân biệt trường phái, nguyên lý và dân gian; không bịa Can Chi, lịch ngày, số liệu, cổ thư, trích dẫn hoặc luận đoán khi không đủ dữ kiện.
6. Không viết câu sáo rỗng như “ai cũng nên biết”, “thu hút tài lộc”, “năng lượng tích cực” nếu không giải thích bằng nội dung cụ thể. Không lặp ý để đủ thời lượng.
7. Lời thoại phải là văn bản hoàn chỉnh người dẫn đọc trực tiếp. Không thay lời thoại bằng ghi chú hoặc gạch đầu dòng.
8. Hook phải đánh đúng một hiểu lầm, câu hỏi chuyên môn hoặc tình huống thực tế của chủ đề; không dùng mở đầu chung chung.
9. Kết thúc bằng kết luận có giá trị, một hành động người xem có thể áp dụng và CTA tinh tế cho Vạn Nhật Khang.
10. Độ dài lời thoại theo tốc độ 130–150 từ/phút; timecode liên tục, tổng thời gian khớp thời lượng.

ĐẦU RA BẮT BUỘC:
A. TÊN VIDEO + GÓC KHAI THÁC (1 câu).
B. NGƯỜI XEM MỤC TIÊU + GIÁ TRỊ NHẬN ĐƯỢC.
C. LUẬN ĐỀ TRUNG TÂM.
D. KỊCH BẢN QUAY DỰNG THEO CẢNH. Mỗi cảnh trình bày:
- Timecode và thời lượng.
- Mục tiêu cảnh / thông tin mới cần truyền tải.
- Hình ảnh, bối cảnh, đạo cụ, cỡ cảnh, góc máy, chuyển động máy.
- LỜI THOẠI NGUYÊN VĂN (đầy đủ, tự nhiên, không viết tắt).
- Chữ xuất hiện trên màn hình.
- Âm thanh, nhạc nền, nhịp cắt dựng.
E. KẾT LUẬN + CTA.
F. GHI CHÚ SẢN XUẤT: hình ảnh cần chuẩn bị, thuật ngữ cần hiển thị, dữ kiện còn cần xác minh.
G. TỰ KIỂM: nêu ngắn các luận điểm đã triển khai và xác nhận không tự bịa dữ kiện.

ƯU TIÊN CHẤT LƯỢNG CHUYÊN MÔN VÀ TÍNH KHẢ THI KHI QUAY HƠN VĂN HOA. Chỉ xuất sản phẩm kịch bản hoàn chỉnh.`;
}
function getResearchText(){
 const el=$('researchResult');if(!el)return '';
 const value=el.innerText.trim();
 if(!value||value.startsWith('Bản nghiên cứu')||value.startsWith('Đang tìm kiếm')||value.startsWith('Không thể nghiên cứu:'))return '';
 return value;
}
$('makeOutline').onclick=async()=>{
 const button=$('makeOutline'),subject=$('idea').value.trim();
 if(!subject){toast('Hãy nhập chủ đề video trước');return}
 const oldText=button.textContent;button.disabled=true;button.textContent='Đang biên tập kịch bản chuyên sâu...';
 try{
  const p=project();const prompt=buildProfessionalPrompt(subject,p,getResearchText());
  const d=await aiJson('/api/script',{prompt});
  if(!d.text)throw new Error('AI chưa trả về kịch bản');
  $('scriptText').value=d.text;p.script=d.text;persist();toast('Đã tạo kịch bản sản xuất chuyên nghiệp');
 }catch(e){toast('Không tạo được kịch bản: '+e.message)}
 finally{button.disabled=false;button.textContent=oldText}
};
function renderScenes(){const p=project();$('sceneCount').textContent=p.scenes.length+' cảnh';$('sceneList').innerHTML='';if(!p.scenes.length){$('sceneList').innerHTML='<div class="empty">Chưa có phân cảnh. Nhấn “Thêm phân cảnh” để lập shot list.</div>';return}p.scenes.forEach((s,i)=>{const card=document.createElement('article');card.className='scene-card';const num=document.createElement('div');num.className='scene-num';num.textContent=String(i+1).padStart(2,'0');const body=document.createElement('div');const title=document.createElement('input');title.placeholder='Tên phân cảnh';title.value=s.title;title.oninput=()=>{s.title=title.value;persist()};const desc=document.createElement('textarea');desc.rows=2;desc.placeholder='Mô tả hình ảnh, hành động, lời thoại, góc máy...';desc.value=s.description;desc.onchange=()=>{s.description=desc.value;persist()};body.append(title,desc);const del=document.createElement('button');del.className='remove';del.textContent='×';del.title='Xóa cảnh';del.onclick=()=>{p.scenes.splice(i,1);persist();renderScenes()};card.append(num,body,del);$('sceneList').append(card)})}
function addScene(){saveForm();project().scenes.push({title:'Phân cảnh mới',description:''});persist();renderScenes();toast('Đã thêm phân cảnh')}
$('addScene').onclick=addScene;
$('videoInput').onchange=e=>{const files=Array.from(e.target.files||[]);if(!files.length)return;const grid=$('mediaGrid');if(grid.querySelector('.empty'))grid.innerHTML='';files.forEach(f=>{const url=URL.createObjectURL(f);mediaUrls.push(url);const card=document.createElement('article');card.className='media-card';const v=document.createElement('video');v.controls=true;v.playsInline=true;v.src=url;const name=document.createElement('p');name.textContent=f.name+' · '+(f.size/1048576).toFixed(1)+' MB';card.append(v,name);grid.append(card)});updateStats();toast('Đã nạp '+files.length+' video để xem trước');e.target.value=''};
$('srtText').value=sampleSrt;
function parseSrt(text){const blocks=text.trim().replace(/\r/g,'').split(/\n\s*\n/);if(!text.trim())return{ok:false,message:'Nội dung đang trống.'};for(let i=0;i<blocks.length;i++){const lines=blocks[i].split('\n');if(lines.length<3||!/^\d+$/.test(lines[0].trim()))return{ok:false,message:'Khối '+(i+1)+': thiếu số thứ tự hoặc nội dung.'};if(!/^\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}$/.test(lines[1].trim()))return{ok:false,message:'Khối '+(i+1)+': sai định dạng thời gian.'}}return{ok:true,message:'Định dạng hợp lệ: '+blocks.length+' đoạn phụ đề.'}}
$('validateSrt').onclick=()=>{const r=parseSrt($('srtText').value);$('srtFeedback').textContent=r.message;toast(r.message)};
$('sampleSrt').onclick=()=>{$('srtText').value=sampleSrt;$('srtFeedback').textContent='Đã khôi phục mẫu.'};
$('srtInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('srtText').value=await f.text();$('srtFeedback').textContent='Đã nhập '+f.name;toast('Đã nhập phụ đề');e.target.value=''};
$('downloadSrt').onclick=()=>{const content=$('srtText').value.trim();const r=parseSrt(content);if(!r.ok){$('srtFeedback').textContent=r.message;toast('Không thể xuất: '+r.message);return}const blob=new Blob(['\uFEFF'+content.replace(/\r?\n/g,'\r\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='van-nhat-khang-subtitles.srt';a.click();URL.revokeObjectURL(url);$('srtFeedback').textContent='Đã tạo tệp SRT.';toast('Đã tải phụ đề SRT')};
$('exportProject').onclick=()=>{saveForm();const blob=new Blob([JSON.stringify({app:'Vạn Nhật Khang AI Video Studio',version:2,exportedAt:new Date().toISOString(),activeId,projects:state.projects},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='van-nhat-khang-project.json';a.click();URL.revokeObjectURL(url);toast('Đã xuất dữ liệu dự án JSON')};

function splitScriptIntoScenes(){saveForm();const raw=$('scriptText').value.trim();if(!raw){toast('Hãy nhập kịch bản trước');return}let chunks=raw.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);if(chunks.length<2)chunks=raw.split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);if(!chunks.length)return;const p=project();p.scenes=chunks.map((text,i)=>({title:'Cảnh '+String(i+1).padStart(2,'0'),description:text}));persist();renderScenes();toast('Đã chia kịch bản thành '+chunks.length+' phân cảnh — hãy rà soát lại')};
$('splitScript').onclick=splitScriptIntoScenes;
function srtTime(seconds){const ms=Math.round(seconds*1000),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),r=ms%1000;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+','+String(r).padStart(3,'0')}
$('makeSrtFromScript').onclick=()=>{const raw=$('scriptText').value.trim();if(!raw){toast('Hãy nhập kịch bản trước');return}const parts=raw.split(/(?<=[.!?。！？])\s+|\n+/).map(x=>x.trim()).filter(Boolean);let t=0;$('srtText').value=parts.map((line,i)=>{const duration=Math.max(2.5,Math.min(6.5,line.length/14));const block=(i+1)+'\n'+srtTime(t)+' --> '+srtTime(t+duration)+'\n'+line;t+=duration;return block}).join('\n\n');$('srtFeedback').textContent='Đã tạo '+parts.length+' đoạn nháp. Vui lòng nghe lại và chỉnh thời gian cho khớp lời nói.';showView('subtitles');toast('Đã tạo phụ đề nháp từ kịch bản')};
$('importProjectBtn').onclick=()=>$('importProjectInput').click();
$('importProjectInput').onchange=async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data.projects)?data.projects:(data.project?[data.project]:null);if(!incoming||!incoming.length)throw new Error('Không tìm thấy dữ liệu dự án hợp lệ');const clean=incoming.filter(p=>p&&typeof p==='object').map(p=>({id:typeof p.id==='string'?p.id:makeId(),title:String(p.title||'Dự án nhập'),duration:p.duration||'60 giây',ratio:p.ratio||'9:16 · Video dọc',visualStyle:p.visualStyle||'Điện ảnh chân thực',idea:p.idea||'',script:p.script||'',scenes:Array.isArray(p.scenes)?p.scenes:[]}));if(!clean.length)throw new Error('Tệp không có dự án');state={activeId:clean[0].id,projects:[...clean,...state.projects]};activeId=clean[0].id;persist();loadForm();showView('dashboard');toast('Đã nhập '+clean.length+' dự án')}catch(err){toast('Không thể nhập tệp: '+err.message)}e.target.value=''};
loadForm();renderProjects();updateStats();
const AI_CFG='vnk-ai-config-v1';
const DEFAULT_WORKER_URL='https://van-nhat-khang-ai-api.taiphanthanh141319.workers.dev';
function normalizeWorkerUrl(value){return String(value||'').trim().replace(/\/+$/,'').replace(/\/api\/health$/i,'').replace(/\/api$/i,'')}
function aiConfig(){try{const saved=localStorage.getItem(AI_CFG)||sessionStorage.getItem(AI_CFG)||'{}';const c=JSON.parse(saved);return{endpoint:normalizeWorkerUrl(c.endpoint||DEFAULT_WORKER_URL),token:String(c.token||'').trim()}}catch(e){return{endpoint:DEFAULT_WORKER_URL,token:''}}}
function saveAiConfig(endpoint,token){const value=JSON.stringify({endpoint:normalizeWorkerUrl(endpoint)||DEFAULT_WORKER_URL,token:String(token||'').trim()});try{localStorage.setItem(AI_CFG,value)}catch(e){}try{sessionStorage.setItem(AI_CFG,value)}catch(e){}}
function aiHeaders(){const c=aiConfig();if(!c.token)throw new Error('Chưa nhập APP_ACCESS_TOKEN. Vào AI Studio → Kết nối máy chủ AI.');return{'Content-Type':'application/json','X-App-Token':c.token}}
function aiUrl(path){const c=aiConfig();return normalizeWorkerUrl(c.endpoint||DEFAULT_WORKER_URL)+path}
async function readApiResponse(r){const raw=await r.text();let d={};try{d=raw?JSON.parse(raw):{}}catch(e){d={error:raw.slice(0,500)||'Máy chủ trả dữ liệu không hợp lệ.'}}if(!r.ok){const message=d.error||('HTTP '+r.status+' – yêu cầu API thất bại.');throw new Error(message)}return d}
async function aiJson(path,body){let r;try{r=await fetch(aiUrl(path),{method:'POST',headers:aiHeaders(),body:JSON.stringify(body)})}catch(e){throw new Error('Không kết nối được Worker. Kiểm tra URL, mạng và CORS. '+e.message)}return readApiResponse(r)}
async function aiUpload(path,file){const h=aiHeaders();delete h['Content-Type'];const fd=new FormData();fd.append('file',file);let r;try{r=await fetch(aiUrl(path),{method:'POST',headers:h,body:fd})}catch(e){throw new Error('Không kết nối được Worker: '+e.message)}return readApiResponse(r)}
function aiBusy(button,busy,label){button.disabled=busy;button.textContent=busy?'Đang xử lý…':label}
$('aiEndpoint').value=aiConfig().endpoint||DEFAULT_WORKER_URL;$('aiToken').value=aiConfig().token||'';
$('aiConnect').onclick=async()=>{const endpoint=normalizeWorkerUrl($('aiEndpoint').value)||DEFAULT_WORKER_URL;const token=$('aiToken').value.trim();if(!token){$('aiConnectionFeedback').textContent='Hãy nhập APP_ACCESS_TOKEN giống hệt Secret trên Cloudflare.';return}saveAiConfig(endpoint,token);$('aiEndpoint').value=endpoint;try{const r=await fetch(endpoint+'/api/health',{method:'POST',headers:{'Content-Type':'application/json','X-App-Token':token},body:JSON.stringify({check:'connection'})});const d=await readApiResponse(r);if(d.authenticated!==true)throw new Error('Worker chưa xác thực token. Hãy đặt cùng một APP_ACCESS_TOKEN ở Cloudflare và ứng dụng.');$('aiStatus').textContent='Máy chủ đã xác thực';$('aiConnectionFeedback').textContent='Xác thực thành công. OpenAI API: '+(d.openaiConfigured?'đã cấu hình':'chưa cấu hình')+'.';toast('Đã kết nối máy chủ AI')}catch(e){$('aiStatus').textContent='Lỗi xác thực';$('aiConnectionFeedback').textContent=e.message;toast(e.message)}};
$('runResearch').onclick=async()=>{const b=$('runResearch'),topic=$('researchTopic').value.trim();if(!topic){toast('Hãy nhập chủ đề nghiên cứu');return}aiBusy(b,true,'Đang tìm kiếm và đối chiếu nguồn...');$('researchResult').textContent='Đang tìm kiếm trên web, đọc và tổng hợp các nguồn...';try{const d=await aiJson('/api/research',{topic});$('researchResult').innerHTML='';const article=document.createElement('div');article.style.whiteSpace='pre-wrap';article.textContent=d.text||'Không có nội dung nghiên cứu.';$('researchResult').append(article);if(d.sources&&d.sources.length){const heading=document.createElement('h3');heading.textContent='Nguồn tham khảo ('+d.sources.length+')';$('researchResult').append(heading);const list=document.createElement('ol');d.sources.forEach(s=>{const li=document.createElement('li'),link=document.createElement('a');link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=s.title;li.append(link);list.append(li)});$('researchResult').append(list)}toast('Đã hoàn tất nghiên cứu web')}catch(e){$('researchResult').textContent='Không thể nghiên cứu: '+e.message;toast(e.message)}finally{aiBusy(b,false,'⌕ Tìm kiếm & tổng hợp')}};
$('researchToScript').onclick=()=>{const text=$('researchResult').innerText.trim();if(!text||text.startsWith('Bản nghiên cứu')||text.startsWith('Đang tìm kiếm')){toast('Hãy nghiên cứu chủ đề trước');return}const topic=$('researchTopic').value.trim();$('idea').value=topic+'\n\nTÀI LIỆU NGHIÊN CỨU ĐÃ TỔNG HỢP:\n'+text;saveForm();showView('script');toast('Đã chuyển nghiên cứu sang phần kịch bản')};
$('aiMakeScript').onclick=async()=>{const b=$('aiMakeScript'),topic=$('aiScriptPrompt').value.trim();if(!topic){toast('Hãy nhập chủ đề kịch bản');return}aiBusy(b,true,'Đang viết kịch bản chuyên sâu...');try{const p=project();const prompt=buildProfessionalPrompt(topic,p,getResearchText());const d=await aiJson('/api/script',{prompt});if(!d.text)throw new Error('AI chưa trả về kịch bản');$('aiScriptResult').value=d.text;toast('Đã tạo kịch bản sản xuất chuyên nghiệp')}catch(e){toast(e.message)}finally{aiBusy(b,false,'✦ Viết kịch bản')}};
$('aiUseScript').onclick=()=>{const t=$('aiScriptResult').value.trim();if(!t){toast('Chưa có kịch bản AI');return}$('scriptText').value=t;saveForm();showView('script');toast('Đã đưa kịch bản vào dự án')};
$('aiMakeImage').onclick=async()=>{const b=$('aiMakeImage'),prompt=$('aiImagePrompt').value.trim();if(!prompt){toast('Hãy nhập mô tả hình ảnh');return}aiBusy(b,true,'✦ Đang tạo ảnh');try{const d=await aiJson('/api/image',{prompt,size:$('aiImageSize').value,quality:'medium'});if(!d.image)throw new Error('Máy chủ không trả về ảnh');$('aiImageResult').innerHTML='';const img=document.createElement('img');img.src=d.image;img.alt='Ảnh AI Vạn Nhật Khang';img.style.maxWidth='100%';img.style.borderRadius='12px';$('aiImageResult').append(img);$('aiImageDownload').href=d.image;$('aiImageDownload').hidden=false;toast('Đã tạo hình ảnh')}catch(e){toast(e.message)}finally{aiBusy(b,false,'✦ Tạo hình ảnh')}};
$('aiMakeSpeech').onclick=async()=>{const b=$('aiMakeSpeech'),text=$('aiSpeechText').value.trim();if(!text){toast('Hãy nhập văn bản cần đọc');return}aiBusy(b,true,'✦ Đang tạo giọng đọc');try{const d=await aiJson('/api/speech',{text,voice:$('aiVoice').value});if(!d.audio)throw new Error('Máy chủ không trả về âm thanh');$('aiAudioResult').src=d.audio;$('aiAudioResult').hidden=false;$('aiAudioDownload').href=d.audio;$('aiAudioDownload').hidden=false;toast('Đã tạo giọng đọc MP3')}catch(e){toast(e.message)}finally{aiBusy(b,false,'✦ Tạo giọng đọc MP3')}};
$('aiTranscribe').onclick=async()=>{const b=$('aiTranscribe'),file=$('aiTranscribeFile').files[0];if(!file){toast('Hãy chọn tệp âm thanh hoặc video');return}if(file.size>24*1024*1024){toast('Tệp vượt giới hạn 24 MB');return}aiBusy(b,true,'✦ Đang nhận dạng');try{const d=await aiUpload('/api/transcribe',file);$('aiTranscriptResult').value=d.text||'';toast('Đã nhận dạng lời nói')}catch(e){toast(e.message)}finally{aiBusy(b,false,'✦ Nhận dạng tiếng Việt')}};
$('aiTranscriptToScript').onclick=()=>{const t=$('aiTranscriptResult').value.trim();if(!t){toast('Chưa có văn bản nhận dạng');return}$('scriptText').value=t;saveForm();showView('script');toast('Đã đưa bản nhận dạng vào kịch bản')};
