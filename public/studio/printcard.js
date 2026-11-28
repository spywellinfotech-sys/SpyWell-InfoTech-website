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
  if(c.nfc){var cx=580,cy=500,r=30;x.fillStyle='#e8141c';x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();
    x.strokeStyle='#fff';x.lineCap='round';x.lineWidth=5;x.beginPath();x.arc(cx+9,cy,22,Math.PI*0.68,Math.PI*1.32);x.stroke();x.beginPath();x.arc(cx+9,cy,12,Math.PI*0.66,Math.PI*1.34);x.stroke();
    x.fillStyle='#fff';x.beginPath();x.arc(cx+9,cy,4.5,0,Math.PI*2);x.fill();
    x.fillStyle='#0b2a4a';x.font='900 24px system-ui,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('NFC',cx,cy+50);
    x.font='600 13px system-ui,Arial,sans-serif';x.fillStyle='#555';x.fillText('Tap',cx,cy+72)}
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

/* Save the PDF to the phone and offer Share */
function el(t,css,tx){var e=document.createElement(t);if(css)e.style.cssText=css;if(tx!=null)e.textContent=tx;return e}
function btn(t,bg,fn){var b=el('button','margin:6px 6px 0 0;padding:9px 12px;border:0;border-radius:10px;font-weight:700;font-size:14px;min-height:40px;color:#fff;background:'+bg,t);b.type='button';b.onclick=fn;return b}
async function save(cards,box,name){box.textContent='';var st=el('div','font-size:14px;margin-top:6px','⏳ PDF बन रहा है ('+cards.length+' कार्ड)…');box.appendChild(st);
  var r;try{r=await pdf(cards,name||'livecard-print',{noSave:true})}catch(e){st.textContent='❌ PDF नहीं बन पाया';return}
  var b=LCPrint.last.blob,fn=LCPrint.last.name;if(!b){st.textContent='❌ PDF नहीं बन पाया';return}var uri='';
  if(window.ViNative&&ViNative.saveFile){try{var b64=await new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(String(fr.result).split(',')[1])};fr.readAsDataURL(b)});uri=ViNative.saveFile(b64,fn,'application/pdf')||''}catch(e){}}
  else if(!window.ViNative){try{var a0=document.createElement('a');a0.href=URL.createObjectURL(b);a0.download=fn;document.body.appendChild(a0);a0.click();a0.remove();uri='web'}catch(e){}}
  st.textContent=uri?'✅ PDF फ़ोन में सेव हुआ (Download/LiveCard) · '+fn:(window.ViNative?'❗ PDF सेव करने के लिए नया LiveCard ऐप (1.0.111+) चाहिए':'❌ सेव नहीं हुआ');
  box.appendChild(btn('📤 PDF शेयर करें','#7a0a10',async function(){
    if(uri&&uri!=='web'&&window.ViNative&&ViNative.shareFile){ViNative.shareFile(uri,'application/pdf');return}
    if(uri&&uri!=='web'&&window.ViNative&&ViNative.emailFile){ViNative.emailFile(uri,'','LiveCard print','');return}
    var f=new File([b],fn,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:fn})}catch(e){}}}));
  return uri}
async function send(sb,cards,box){return save(cards,box,cards.length===1?'livecard-'+cards[0].slug:'livecard-print-'+cards.length)}
window.LCPrint={draw:draw,pdf:pdf,back:back,send:send,save:save};
})();
