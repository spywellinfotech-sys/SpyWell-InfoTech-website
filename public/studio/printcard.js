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

/* Send to printer: upload PDF, then WhatsApp + email link (admin) */
var PCFG=null;
async function cfg(sb,force){if(PCFG&&!force)return PCFG;var r=await sb.from('studio_admin_kv').select('k,v').in('k',['printer_email','printer_wa']);var o={email:'',wa:''};((r&&r.data)||[]).forEach(function(x){if(x.k==='printer_email')o.email=x.v;if(x.k==='printer_wa')o.wa=x.v});PCFG=o;return o}
async function setCfg(sb,o){await sb.from('studio_admin_kv').upsert([{k:'printer_email',v:o.email||'',updated_at:new Date().toISOString()},{k:'printer_wa',v:o.wa||'',updated_at:new Date().toISOString()}],{onConflict:'k'});PCFG=o}
function openWa(no,tx){no=String(no||'').replace(/\D/g,'');if(no.length===10)no='91'+no;if(window.ViNative&&ViNative.openWa){try{if(ViNative.openWa(no,tx,false))return}catch(e){}}window.open('https://wa.me/'+no+'?text='+encodeURIComponent(tx),'_blank','noopener')}
function el(t,css,tx){var e=document.createElement(t);if(css)e.style.cssText=css;if(tx!=null)e.textContent=tx;return e}
function btn(t,bg,fn){var b=el('button','margin:6px 6px 0 0;padding:9px 12px;border:0;border-radius:10px;font-weight:700;font-size:14px;color:#fff;background:'+bg,t);b.type='button';b.onclick=fn;return b}
async function settingsUI(sb,box,then){var c=await cfg(sb);box.textContent='';var w=el('div','margin-top:8px;padding:10px;border:1.5px solid #f0c24b;border-radius:12px;background:#fff7e0;color:#3a2400');
  w.appendChild(el('b','',"🖨️ प्रिंटर की जानकारी (एक बार)"));var e=el('input','display:block;width:100%;box-sizing:border-box;margin:6px 0;padding:9px;border-radius:9px;border:1px solid #ddd;font-size:16px');e.type='email';e.placeholder='प्रिंटर का ईमेल';e.value=c.email||'';
  var n=el('input',e.style.cssText);n.type='tel';n.placeholder='प्रिंटर का WhatsApp नंबर';n.value=c.wa||'';w.appendChild(e);w.appendChild(n);
  w.appendChild(btn('सेव करें','#d4141c',async function(){var o={email:e.value.trim(),wa:n.value.replace(/\D/g,'').slice(-10)};if(!o.email&&!o.wa)return;await setCfg(sb,o);box.textContent='';then&&then()}));box.appendChild(w)}
async function send(sb,cards,box){box.textContent='';var st=el('div','font-size:14px;margin-top:6px','⏳ PDF बन रहा है…');box.appendChild(st);
  var c=await cfg(sb);if(!c.email&&!c.wa){settingsUI(sb,box,function(){send(sb,cards,box)});return}
  try{await pdf(cards,'p',{noSave:true})}catch(e){st.textContent='❌ PDF नहीं बन पाया';return}
  var b=LCPrint.last.blob;if(!b){st.textContent='❌ PDF नहीं बन पाया';return}st.textContent='⏳ अपलोड हो रहा है…';
  var nm=(cards.length===1?cards[0].slug:'batch-'+cards.length)+'-'+Date.now()+'.pdf';var path=new Date().toISOString().slice(0,7)+'/'+nm.replace(/[^a-zA-Z0-9._-]/g,'-');
  var up=await sb.storage.from('studio-print').upload(path,b,{contentType:'application/pdf',upsert:true});if(up.error){st.textContent='❌ अपलोड नहीं हुआ';return}
  var url=sb.storage.from('studio-print').getPublicUrl(path).data.publicUrl;var now=new Date().toISOString();
  try{await sb.from('studio_card_prints').upsert(cards.map(function(x){return {design_id:x.design_id||x.id,sent_at:now,pdf_url:url,updated_at:now}}),{onConflict:'design_id'})}catch(e){}
  var tx='🖨️ LiveCard Print\n'+cards.map(function(x){return '• '+(x.title||'')+' (livecard.in/v/'+x.slug+')'}).join('\n')+'\n\nPDF: '+url+'\n\nदोनों तरफ़ (duplex) प्रिंट, साइज़ 54 × 86 mm (डेबिट कार्ड), गोल कोने।\n— SpyWell InfoTech · LiveCard.in';
  st.textContent='✅ PDF लिंक तैयार:';var a=el('a','display:block;word-break:break-all;font-size:13px;color:#1a73e8',url);a.href=url;a.target='_blank';box.appendChild(a);
  if(c.wa)box.appendChild(btn('💬 WhatsApp पर भेजें','#25d366',function(){openWa(c.wa,tx)}));
  if(c.email)box.appendChild(btn('📧 ईमेल भेजें','#1a73e8',function(){location.href='mailto:'+c.email+'?subject='+encodeURIComponent('LiveCard print: '+(cards.length>1?cards.length+' cards':(cards[0].title||cards[0].slug)))+'&body='+encodeURIComponent(tx)}));
  box.appendChild(btn('🔗 लिंक कॉपी','#6d6060',function(){try{navigator.clipboard.writeText(url)}catch(e){}this.textContent='✓ कॉपी हुआ'}));
  box.appendChild(btn('⚙️ प्रिंटर बदलें','#999',function(){settingsUI(sb,box,function(){send(sb,cards,box)})}));
  if(c.wa)openWa(c.wa,tx);else if(c.email)location.href='mailto:'+c.email+'?subject='+encodeURIComponent('LiveCard print')+'&body='+encodeURIComponent(tx)}
window.LCPrint={draw:draw,pdf:pdf,back:back,send:send,settings:settingsUI};
})();
