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
  x.fillStyle='#fff7f4';x.fillRect(0,0,W,H);
  x.strokeStyle='#e8c9c4';x.lineWidth=3;rr(x,6,6,W-12,H-12,34);x.stroke();
  var lg=await img('/studio/livecard-logo.png'),st=await img('/studio/livecard-stamp.png');
  if(lg){var lh=118,lw=lg.width*lh/lg.height;x.drawImage(lg,(W-lw)/2,34,lw,lh)}
  x.textAlign='center';x.textBaseline='alphabetic';
  var tg='Visiting Card नहीं, अब LiveCard';fit(x,tg,W-60,38,'800');x.fillStyle='#d4141c';x.fillText(tg,W/2,200);
  var nm=nameOf(c);fit(x,nm,W-60,44,'800');x.fillStyle='#7a0a10';x.fillText(nm,W/2,258);
  var q=document.createElement('canvas');window.StudioQR.draw(q,url,900);
  var bs=440,bx=(W-bs)/2,by=284;x.save();x.shadowColor='rgba(122,10,16,.22)';x.shadowBlur=24;x.shadowOffsetY=8;x.fillStyle='#fff';rr(x,bx,by,bs,bs,34);x.fill();x.restore();
  x.imageSmoothingEnabled=false;var qs=bs-40;x.drawImage(q,bx+20,by+20,qs,qs);x.imageSmoothingEnabled=true;
  var ln=url.replace(/^https?:\/\//,'');fit(x,ln,W-60,30,'700');x.fillStyle='#555';x.fillText(ln,W/2,by+bs+48);
  if(st){var ss=136;x.drawImage(st,(W-ss)/2,by+bs+66,ss,ss)}
  fit(x,'Created with LiveCard.in',W-60,30,'800');x.fillStyle='#7a0a10';x.fillText("Created with LiveCard.in",W/2,H-34);
  return cv}
function loadPdf(){return new Promise(function(res,rej){if(window.jspdf)return res(window.jspdf);var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=function(){res(window.jspdf)};s.onerror=rej;document.head.appendChild(s)})}
async function pdf(cards,name){var J=await loadPdf();var doc=new J.jsPDF({unit:'mm',format:[53.98,85.6],orientation:'portrait',compress:true});
  for(var i=0;i<cards.length;i++){if(i)doc.addPage([53.98,85.6],'portrait');var cv=await draw(cards[i]);doc.addImage(cv.toDataURL('image/jpeg',0.95),'JPEG',0,0,53.98,85.6)}
  var fn=(name||'livecard-qr-card').replace(/[^a-zA-Z0-9-_]+/g,'-').slice(0,60)+'.pdf';
  if(window.ViNative&&ViNative.saveFile){var b64=doc.output('datauristring').split(',')[1];var r='';try{r=ViNative.saveFile(b64,fn,'application/pdf')}catch(e){}return r?'saved':'fail'}
  if(window.ViNative){ // old app: no PDF saving, save PNG to gallery instead
    var ok=0;for(var k=0;k<cards.length;k++){var c2=await draw(cards[k]);try{if(ViNative.save(c2.toDataURL('image/png').split(',')[1],'livecard-qr-'+cards[k].slug))ok++}catch(e){}}return ok?'png':'fail'}
  doc.save(fn);return 'saved'}
window.LCPrint={draw:draw,pdf:pdf};
})();
