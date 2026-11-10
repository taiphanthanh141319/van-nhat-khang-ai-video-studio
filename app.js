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
$('manualScript').onclick=()=>{showView('script');$('scriptText').focus();$('scriptFeedback').textContent='Chế độ thủ công đang bật: anh có thể tự viết hoặc dán kịch bản, chia thành phân cảnh và lưu ngay trên thiết bị. Không gọi OpenAI API, không mất credit.';toast('Đã chuyển sang nhập kịch bản thủ công')};

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

// FREE STUDIO — xử lý hoàn toàn tại trình duyệt, không gọi API.
const freeCanvas=$('freeCanvas'),freeCtx=freeCanvas.getContext('2d');let freeBitmaps=[];
$('freeImages').onchange=async e=>{freeBitmaps=[];for(const f of Array.from(e.target.files||[])){try{freeBitmaps.push(await createImageBitmap(f))}catch(err){}}$('freeImageNames').textContent=freeBitmaps.length+' ảnh đã sẵn sàng';drawFreeFrame(0);e.target.value=''};
function freeDimensions(){const v=$('freeRatio').value;return v==='landscape'?[1920,1080]:v==='square'?[1080,1080]:[1080,1920]}
function drawFreeFrame(index,progress=0,previousIndex=null){
 if(!freeBitmaps.length)return;
 const [w,h]=freeDimensions();freeCanvas.width=w;freeCanvas.height=h;
 const img=freeBitmaps[index%freeBitmaps.length];
 freeCtx.fillStyle='#100d15';freeCtx.fillRect(0,0,w,h);
 function paintImage(source,alpha=1,zoom=1,shift=0){
  const cover=Math.max(w/source.width,h/source.height);
  freeCtx.save();freeCtx.globalAlpha=alpha;freeCtx.filter='blur(24px)';
  freeCtx.drawImage(source,(w-source.width*cover)/2,(h-source.height*cover)/2,source.width*cover,source.height*cover);freeCtx.restore();
  const fit=Math.max(w/source.width,h/source.height)*zoom,dw=source.width*fit,dh=source.height*fit;
  freeCtx.save();freeCtx.globalAlpha=alpha;freeCtx.drawImage(source,(w-dw)/2+shift,(h-dh)/2,dw,dh);freeCtx.restore();
 }
 const zoom=1.02+progress*.075,shift=Math.sin(progress*Math.PI)*w*.012;
 paintImage(img,1,zoom,shift);
 if(previousIndex!==null&&progress<.22){const prev=freeBitmaps[previousIndex%freeBitmaps.length];paintImage(prev,Math.max(0,1-progress/.22),1.05,0)}
 const g=freeCtx.createLinearGradient(0,h*.62,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.84)');freeCtx.fillStyle=g;freeCtx.fillRect(0,0,w,h);
 const title=$('freeTitle').value.trim()||'VẠN NHẬT KHANG';
 freeCtx.textAlign='center';freeCtx.fillStyle='#f8e5b0';freeCtx.font='bold '+Math.round(w*.055)+'px Georgia';
 const words=title.split(/\s+/);let line='',lines=[];for(const word of words){const t=line?line+' '+word:word;if(freeCtx.measureText(t).width>w*.8&&line){lines.push(line);line=word}else line=t}if(line)lines.push(line);
 lines.slice(0,3).forEach((l,i)=>freeCtx.fillText(l,w/2,h*.77+i*w*.07,w*.82));
 freeCtx.fillStyle='#e7c987';freeCtx.font='bold '+Math.round(w*.026)+'px Arial';freeCtx.fillText($('freeFooter').value||'VẠN NHẬT KHANG · PHONG THUỶ MỆNH LÝ ỨNG DỤNG',w/2,h*.95,w*.9);
 freeCtx.strokeStyle='#d9b76c';freeCtx.lineWidth=Math.max(2,w*.002);freeCtx.beginPath();freeCtx.moveTo(w*.1,h*.91);freeCtx.lineTo(w*.9,h*.91);freeCtx.stroke();
}\n$('freePreview').onclick=()=>{if(!freeBitmaps.length)return toast('Hãy chọn ảnh trước');drawFreeFrame(0);toast('Đã xem trước')};
$('freeRender').onclick=async()=>{
 if(!freeBitmaps.length)return toast('Hãy chọn ảnh trước');
 if(!window.MediaRecorder||!freeCanvas.captureStream)return toast('Hãy dùng Chrome hoặc Edge phiên bản mới');
 const b=$('freeRender');b.disabled=true;b.textContent='ĐANG TỰ ĐỘNG DỰNG...';let stream,audio=null,ctx=null;
 try{
  const [w,h]=freeDimensions();freeCanvas.width=w;freeCanvas.height=h;stream=freeCanvas.captureStream(30);
  if($('freeAudio').files[0]){
   audio=new Audio(URL.createObjectURL($('freeAudio').files[0]));audio.loop=true;ctx=new AudioContext();
   const src=ctx.createMediaElementSource(audio),dest=ctx.createMediaStreamDestination();src.connect(dest);src.connect(ctx.destination);
   dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));await ctx.resume();await audio.play();
  }
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:8000000}:undefined),chunks=[];
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};const stopped=new Promise(resolve=>rec.onstop=resolve);rec.start(250);
  const sec=Number($('freeSeconds').value)||4,transition=.7,fps=30,total=freeBitmaps.length*sec;
  $('freeStatus').textContent='Đang tự động ghép ảnh, tạo chuyển cảnh hòa trộn và hiệu ứng zoom điện ảnh...';
  for(let i=0;i<freeBitmaps.length;i++){
   const start=performance.now(),duration=sec*1000;
   while(performance.now()-start<duration){
    const elapsed=performance.now()-start,progress=Math.min(1,elapsed/duration),previous=i>0?i-1:null;
    drawFreeFrame(i,progress,(previous!==null&&elapsed<transition*1000)?previous:null);
    $('freeStatus').textContent='Đang dựng cảnh '+(i+1)+'/'+freeBitmaps.length+' · '+Math.round(((i+progress)/freeBitmaps.length)*100)+'%';
    await new Promise(r=>setTimeout(r,1000/fps));
   }
  }
  rec.stop();await stopped;if(audio){audio.pause();audio.src='';}
  const blob=new Blob(chunks,{type:rec.mimeType||'video/webm'}),url=URL.createObjectURL(blob);
  $('freeResult').src=url;$('freeResult').style.display='block';$('freeDownload').href=url;$('freeDownload').hidden=false;
  $('freeStatus').textContent='Hoàn tất: '+freeBitmaps.length+' ảnh · '+total+' giây · chuyển cảnh và zoom tự động · '+(blob.size/1048576).toFixed(1)+' MB. Dựng hoàn toàn trên thiết bị, miễn phí, không dùng API.';
  toast('Đã tự động dựng xong video');
 }catch(err){$('freeStatus').textContent='Lỗi dựng video: '+err.message;toast(err.message)}
 finally{if(stream)stream.getTracks().forEach(t=>t.stop());if(ctx)await ctx.close().catch(()=>{});b.disabled=false;b.textContent='✦ TỰ ĐỘNG DỰNG VIDEO MIỄN PHÍ'}
};
$('freeRatio').onchange=()=>drawFreeFrame(0);$('freeTitle').oninput=()=>drawFreeFrame(0);$('freeFooter').oninput=()=>drawFreeFrame(0);

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


// OPEN-SOURCE AI ENGINES — ComfyUI orchestration for FLUX, SD, Wan2.1 and LTX.
let comfyLastPromptId='';
$('comfyCheck').onclick=async()=>{
 const b=$('comfyCheck');aiBusy(b,true,'Checking ComfyUI…');
 try{
  const c=aiConfig();if(!c.token)throw new Error('Hãy cấu hình APP_ACCESS_TOKEN trong AI Studio trước.');
  const r=await fetch(aiUrl('/api/comfy/health'),{headers:{'X-App-Token':c.token}});
  const d=await readApiResponse(r);
  $('comfyStatus').textContent=d.ok?'ComfyUI sẵn sàng':'Chưa sẵn sàng';
  $('comfyFeedback').textContent=d.message||'Đã kết nối tới ComfyUI.';
  toast('Kiểm tra ComfyUI hoàn tất');
 }catch(e){$('comfyStatus').textContent='Chưa kết nối';$('comfyFeedback').textContent=e.message;toast(e.message)}
 finally{aiBusy(b,false,'Kiểm tra ComfyUI')}
};
$('comfyQueue').onclick=async()=>{
 const b=$('comfyQueue'),raw=$('comfyWorkflow').value.trim();
 if(!raw){toast('Hãy dán workflow API JSON từ ComfyUI');return}
 let workflow;try{workflow=JSON.parse(raw)}catch(e){toast('Workflow JSON không hợp lệ: '+e.message);return}
 if(!workflow||typeof workflow!=='object'||Array.isArray(workflow)){toast('Workflow phải là JSON object ở định dạng API');return}
 aiBusy(b,true,'Đang gửi tác vụ tới GPU…');
 try{
  const d=await aiJson('/api/comfy/queue',{workflow,engine:$('comfyEngine').value});
  if(!d.prompt_id)throw new Error(d.error||'ComfyUI không trả prompt_id');
  comfyLastPromptId=d.prompt_id;$('comfyPromptId').textContent='Prompt ID: '+comfyLastPromptId;
  $('comfyFeedback').textContent='Đã xếp hàng tác vụ trên ComfyUI. GPU sẽ xử lý theo hàng đợi.';
  $('comfyOutput').textContent='Đang chờ xử lý. Nhấn “Kiểm tra tiến độ” để lấy trạng thái.';
  toast('Đã gửi workflow tới ComfyUI');
 }catch(e){$('comfyFeedback').textContent=e.message;toast(e.message)}
 finally{aiBusy(b,false,'Gửi tác vụ đến GPU')}
};
$('comfyHistory').onclick=async()=>{
 const id=comfyLastPromptId||$('comfyPromptId').textContent.replace('Prompt ID: ','').trim();
 if(!id){toast('Chưa có Prompt ID để kiểm tra');return}
 const b=$('comfyHistory');aiBusy(b,true,'Đang kiểm tra…');
 try{
  const c=aiConfig(),r=await fetch(aiUrl('/api/comfy/history?prompt_id='+encodeURIComponent(id)),{headers:{'X-App-Token':c.token}});
  const d=await readApiResponse(r);
  const record=d.history&&d.history[id]||d[id]||d;
  $('comfyOutput').innerHTML='';
  const status=document.createElement('p');
  const outputs=record.outputs||{};
  const files=[];
  Object.values(outputs).forEach(node=>['images','gifs','videos'].forEach(kind=>
   (node[kind]||[]).forEach(file=>files.push(file))));
  status.textContent=files.length?'Hoàn thành · '+files.length+' tệp đầu ra.':'Đã nhận lịch sử tác vụ. Nếu chưa có output, tác vụ có thể vẫn đang chạy hoặc workflow chưa tạo output được lưu.';
  $('comfyOutput').append(status);
  files.forEach(file=>{
   const link=document.createElement('a');link.href=aiUrl('/api/comfy/view?filename='+encodeURIComponent(file.filename)+'&subfolder='+encodeURIComponent(file.subfolder||'')+'&type='+encodeURIComponent(file.type||'output'));
   link.target='_blank';link.rel='noopener noreferrer';link.textContent='Mở '+file.filename;link.style.display='block';link.style.margin='8px';
   link.onclick=async ev=>{ev.preventDefault();try{const rr=await fetch(link.href,{headers:{'X-App-Token':c.token}});if(!rr.ok)throw new Error('Không tải được output');const blob=await rr.blob(),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(err){toast(err.message)}};
   $('comfyOutput').append(link);
  });
  toast(files.length?'Đã lấy output ComfyUI':'Đã cập nhật lịch sử tác vụ');
 }catch(e){$('comfyOutput').textContent=e.message;toast(e.message)}
 finally{aiBusy(b,false,'Kiểm tra tiến độ')}
};
