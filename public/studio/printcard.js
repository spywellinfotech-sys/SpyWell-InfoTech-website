/* LiveCard QR print card: debit-card size (53.98 x 85.6 mm, portrait) PDF */
(function(){
var W=638,H=1011; // 300 dpi
var IMG={};
function img(src){if(IMG[src])return IMG[src];IMG[src]=new Promise(function(res){var i=new Image();i.onload=function(){res(i)};i.onerror=function(){res(null)};i.src=src});return IMG[src]}
function fit(ctx,txt,max,size,weight){var s=size;do{ctx.font=weight+' '+s+'px "Baloo 2",system-ui,sans-serif';if(ctx.measureText(txt).width<=max)break;s-=2}while(s>14);return s}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function nameOf(c){var t=String(c.title||'').trim();return (!t||/^(visiting\s*card|विज़िटिंग\s*कार्ड|विजिटिंग\s*कार्ड)$/i.test(t))?'LiveCard':t}
async function draw(c){var cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
  var url='https://livecard.in/v/'+c.slug;
  var bg=await img('/studio/livecard-card-front.jpg?v=3');
  if(bg)x.drawImage(bg,0,0,W,H);else{x.fillStyle='#fff';x.fillRect(0,0,W,H)}
  x.textAlign='center';x.textBaseline='middle';
  var nm=nameOf(c);fit(x,nm,440,50,'800');x.fillStyle='#7a0a10';x.fillText(nm,W/2,224);
  var q=document.createElement('canvas');window.StudioQR.draw(q,url,1200);var qx=q.getContext('2d'),qd=qx.getImageData(0,0,q.width,q.height).data,fx=0,mid=0;
  for(var yy=0;yy<q.height&&!fx;yy++){for(var xx=0;xx<q.width;xx++){if(qd[(yy*q.width+xx)*4]<128){fx=xx;mid=yy;break}}}
  var qz=fx||Math.round(q.width*4/41),inner=q.width-2*qz;
  x.imageSmoothingEnabled=false;var qs=292;x.drawImage(q,qz,qz,inner,inner,(W-qs)/2,541-qs/2,qs,qs);x.imageSmoothingEnabled=true;
  var ln=url.replace(/^https?:\/\//,'');fit(x,ln,370,31,'700');x.fillStyle='#333';x.fillText(ln,W/2,757);
  return cv}
var _bk=null;async function back(){if(_bk)return _bk;var b=await img('/studio/livecard-card-back.jpg?v=3');if(!b)return null;var cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
  x.translate(W/2,H/2);x.rotate(-Math.PI/2);x.drawImage(b,-H/2,-W/2,H,W);_bk=cv.toDataURL('image/jpeg',0.95);return _bk}
function loadPdf(){return new Promise(function(res,rej){if(window.jspdf)return res(window.jspdf);var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=function(){res(window.jspdf)};s.onerror=rej;document.head.appendChild(s)})}
async function pdf(cards,name,opt){var J=await loadPdf();var doc=new J.jsPDF({unit:'mm',format:[53.98,85.6],orientation:'portrait',compress:true});
  var bk=await back();
  for(var i=0;i<cards.length;i++){if(i)doc.addPage([53.98,85.6],'portrait');var cv=await draw(cards[i]);doc.addImage(cv.toDataURL('image/jpeg',0.95),'JPEG',0,0,53.98,85.6);
    if(bk){doc.addPage([53.98,85.6],'portrait');doc.addImage(bk,'JPEG',0,0,53.98,85.6)}}
  var fn=(name||'livecard-qr-card').replace(/[^a-zA-Z0-9-_]+/g,'-').slice(0,60)+'.pdf';
  LCPrint.last={name:fn,blob:null,uri:''};
  if(opt&&opt.noSave){LCPrint.last.blob=doc.output('blob');return 'blob'}
  if(window.ViNative&&ViNative.saveFile){var b64=doc.output('datauristring').split(',')[1];var r='';try{r=ViNative.saveFile(b64,fn,'application/pdf')}catch(e){}LCPrint.last.uri=r||'';return r?'saved':'fail'}
  if(window.ViNative){ // old app: no PDF saving, save PNG to gallery instead
    var ok=0;for(var k=0;k<cards.length;k++){var c2=await draw(cards[k]);try{if(ViNative.save(c2.toDataURL('image/png').split(',')[1],'livecard-qr-'+cards[k].slug))ok++}catch(e){}}return ok?'png':'fail'}
  doc.save(fn);return 'saved'}

/* Printers (admin): saved list, send PDF link via WhatsApp / email */
var PL=null;
async function printers(sb,force){if(PL&&!force)return PL;var r=await sb.from('studio_admin_kv').select('k,v').in('k',['printers','printer_email','printer_wa']);var m={};((r&&r.data)||[]).forEach(function(x){m[x.k]=x.v});
  var L=[];try{L=JSON.parse(m.printers||'[]')}catch(e){L=[]}if(!L.length&&(m.printer_email||m.printer_wa))L=[{id:'p1',name:'प्रिंटर',mobile:m.printer_wa||'',email:m.printer_email||''}];PL=L;return L}
async function savePrinters(sb,L){PL=L;var r=await sb.from('studio_admin_kv').upsert({k:'printers',v:JSON.stringify(L),updated_at:new Date().toISOString()},{onConflict:'k'});return !r.error}
function openWa(no,tx){no=String(no||'').replace(/\D/g,'');if(no.length===10)no='91'+no;if(window.ViNative&&ViNative.openWa){try{if(ViNative.openWa(no,tx,false))return}catch(e){}}window.open('https://wa.me/'+no+'?text='+encodeURIComponent(tx),'_blank','noopener')}
function el(t,css,tx){var e=document.createElement(t);if(css)e.style.cssText=css;if(tx!=null)e.textContent=tx;return e}
function btn(t,bg,fn,fg){var b=el('button','margin:6px 6px 0 0;padding:9px 12px;border:0;border-radius:10px;font-weight:700;font-size:14px;min-height:40px;color:'+(fg||'#fff')+';background:'+bg,t);b.type='button';b.onclick=fn;return b}
function inp(ph,type,val){var i=el('input','display:block;width:100%;box-sizing:border-box;margin:5px 0;padding:9px 10px;border-radius:9px;border:1px solid #ddd;font-size:16px');i.type=type||'text';i.placeholder=ph;i.value=val||'';return i}
/* printer manager: pick (onPick(p)) + add/edit/delete */
async function manage(sb,box,onPick,curId){var L=await printers(sb);box.textContent='';var w=el('div','padding:10px;border:1.5px solid #f0c24b;border-radius:12px;background:#fff7e0;color:#3a2400');box.appendChild(w);
  w.appendChild(el('b','font-size:16px','🖨️ प्रिंटर चुनें'));
  if(!L.length)w.appendChild(el('div','font-size:13px;margin-top:4px','अभी कोई प्रिंटर सेव नहीं। नीचे जोड़ें।'));
  L.forEach(function(p,i){var r=el('div','display:flex;align-items:center;gap:8px;margin-top:8px;background:#fff;border-radius:10px;padding:8px 10px;border:1.5px solid '+(p.id===curId?'#d4141c':'#eee'));
    var t=el('div','flex:1;min-width:0');t.appendChild(el('b','display:block',p.name||'प्रिंटर'));t.appendChild(el('div','font-size:12px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap',[p.mobile,p.email].filter(Boolean).join(' · ')));r.appendChild(t);
    var ch=btn('चुनें ›','#d4141c',function(){onPick(p)});ch.style.margin='0';r.appendChild(ch);
    var ed=btn('✏️','#fff',function(){form(p,i)},'#333');ed.style.cssText+=';margin:0;border:1px solid #ddd';r.appendChild(ed);
    var dl=btn('🗑','#fff',async function(){if(!dl.dataset.a){dl.dataset.a='1';dl.textContent='पक्का?';return}L.splice(i,1);await savePrinters(sb,L);manage(sb,box,onPick,curId)},'#b00020');dl.style.cssText+=';margin:0;border:1px solid #f3c';r.appendChild(dl);
    w.appendChild(r)});
  var fb=el('div','');w.appendChild(fb);
  function form(p,idx){fb.textContent='';var f=el('div','margin-top:10px;background:#fff;border-radius:10px;padding:10px;border:1px solid #eee');f.appendChild(el('b','',idx==null?'➕ नया प्रिंटर':'✏️ प्रिंटर बदलें'));
    var n=inp('नाम (जैसे: Sharma Printers)','text',p&&p.name),mo=inp('मोबाइल / WhatsApp नंबर','tel',p&&p.mobile),em=inp('ईमेल','email',p&&p.email);mo.inputMode='numeric';var er=el('div','font-size:13px;color:#b00020');
    f.appendChild(n);f.appendChild(mo);f.appendChild(em);f.appendChild(er);
    f.appendChild(btn('💾 सेव करें','#0f9d8a',async function(){var o={id:(p&&p.id)||('p'+Date.now()),name:n.value.trim(),mobile:mo.value.replace(/\D/g,'').slice(-10),email:em.value.trim()};
      if(!o.name){er.textContent='नाम लिखें';return}if(!o.mobile&&!o.email){er.textContent='मोबाइल या ईमेल में से कम से कम एक लिखें';return}if(o.mobile&&!/^[6-9][0-9]{9}$/.test(o.mobile)){er.textContent='सही 10 अंक का मोबाइल लिखें';return}if(o.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)){er.textContent='सही ईमेल लिखें';return}
      if(idx==null)L.push(o);else L[idx]=o;var ok=await savePrinters(sb,L);if(!ok){er.textContent='सेव नहीं हुआ';return}manage(sb,box,onPick,curId)}));
    f.appendChild(btn('रद्द','#999',function(){fb.textContent=''}));fb.appendChild(f)}
  w.appendChild(btn('➕ नया प्रिंटर जोड़ें','#7a0a10',function(){form(null,null)}));
  if(!L.length)form(null,null)}
/* make PDF, upload, show WhatsApp / email options for chosen printer */
async function send(sb,cards,box,pr){box.textContent='';
  if(!pr){manage(sb,box,function(p){send(sb,cards,box,p)});return}
  var st=el('div','font-size:14px;margin-top:6px','⏳ PDF बन रहा है ('+cards.length+' कार्ड)…');box.appendChild(st);
  try{await pdf(cards,'p',{noSave:true})}catch(e){st.textContent='❌ PDF नहीं बन पाया';return}
  var b=LCPrint.last.blob;if(!b){st.textContent='❌ PDF नहीं बन पाया';return}st.textContent='⏳ अपलोड हो रहा है…';
  var nm=(cards.length===1?cards[0].slug:'batch-'+cards.length)+'-'+Date.now()+'.pdf';var path=new Date().toISOString().slice(0,7)+'/'+nm.replace(/[^a-zA-Z0-9._-]/g,'-');
  var up=await sb.storage.from('studio-print').upload(path,b,{contentType:'application/pdf',upsert:true});if(up.error){st.textContent='❌ अपलोड नहीं हुआ';return}
  var url=sb.storage.from('studio-print').getPublicUrl(path).data.publicUrl;var now=new Date().toISOString();
  try{await sb.from('studio_card_prints').upsert(cards.map(function(x){return {design_id:x.design_id||x.id,sent_at:now,pdf_url:url,updated_at:now}}),{onConflict:'design_id'})}catch(e){}
  var tx='नमस्ते '+(pr.name||'')+' जी,\n🖨️ LiveCard कार्ड प्रिंट करने हैं ('+cards.length+'):\n'+cards.map(function(x){return '• '+(x.title||'')+' (livecard.in/v/'+x.slug+')'}).join('\n')+'\n\nPDF: '+url+'\n\nदोनों तरफ़ (duplex) प्रिंट, साइज़ 54 × 86 mm (डेबिट कार्ड), गोल कोने।\n— SpyWell InfoTech · LiveCard.in';
  var fn2=LCPrint.last.name||nm,uri='';
  if(window.ViNative&&ViNative.saveFile){try{var b64=await new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(String(fr.result).split(',')[1])};fr.readAsDataURL(b)});uri=ViNative.saveFile(b64,fn2,'application/pdf')||''}catch(e){}}
  else if(!window.ViNative){try{var a0=document.createElement('a');a0.href=URL.createObjectURL(b);a0.download=fn2;document.body.appendChild(a0);a0.click();a0.remove();uri='web'}catch(e){}}
  box.appendChild(el('div','font-size:14px;margin-top:4px',uri?'📥 PDF फ़ोन में सेव हुआ (Download/LiveCard)':'⚠️ फ़ोन में सेव नहीं हुआ — नीचे "PDF खोलें" से डाउनलोड करें'));
  box.appendChild(btn('📤 PDF शेयर करें','#7a0a10',async function(){
    if(uri&&uri!=='web'&&window.ViNative&&ViNative.shareFile){ViNative.shareFile(uri,'application/pdf');return}
    var f=new File([b],fn2,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:fn2})}catch(e){}return}
    if(window.ViNative&&ViNative.shareText){ViNative.shareText(tx);return}try{navigator.clipboard.writeText(url)}catch(e){}this.textContent='✓ लिंक कॉपी हुआ'}));
  st.textContent='✅ PDF तैयार — '+(pr.name||'प्रिंटर')+' को भेजें:';
  box.appendChild(el('div','font-size:13px;margin-top:8px;color:#555','या सीधे लिंक भेजें:'));
  if(pr.mobile)box.appendChild(btn('💬 WhatsApp पर भेजें','#25d366',function(){openWa(pr.mobile,tx)}));
  if(pr.email)box.appendChild(btn('📧 ईमेल भेजें','#1a73e8',function(){location.href='mailto:'+pr.email+'?subject='+encodeURIComponent('LiveCard print: '+(cards.length>1?cards.length+' cards':(cards[0].title||cards[0].slug)))+'&body='+encodeURIComponent(tx)}));
  box.appendChild(btn('🔗 लिंक कॉपी','#6d6060',function(){try{navigator.clipboard.writeText(url)}catch(e){}this.textContent='✓ कॉपी हुआ'}));
  var a=el('a','display:block;word-break:break-all;font-size:12px;color:#1a73e8;margin-top:6px','📄 PDF खोलें');a.href=url;a.target='_blank';box.appendChild(a)}
window.LCPrint={draw:draw,pdf:pdf,back:back,send:send,manage:manage,printers:printers};
})();
