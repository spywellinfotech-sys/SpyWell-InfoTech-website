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
async function pdf(cards,name){var J=await loadPdf();var doc=new J.jsPDF({unit:'mm',format:[53.98,85.6],orientation:'portrait',compress:true});
  var bk=await back();
  for(var i=0;i<cards.length;i++){if(i)doc.addPage([53.98,85.6],'portrait');var cv=await draw(cards[i]);doc.addImage(cv.toDataURL('image/jpeg',0.95),'JPEG',0,0,53.98,85.6);
    if(bk){doc.addPage([53.98,85.6],'portrait');doc.addImage(bk,'JPEG',0,0,53.98,85.6)}}
  var fn=(name||'livecard-qr-card').replace(/[^a-zA-Z0-9-_]+/g,'-').slice(0,60)+'.pdf';
  if(window.ViNative&&ViNative.saveFile){var b64=doc.output('datauristring').split(',')[1];var r='';try{r=ViNative.saveFile(b64,fn,'application/pdf')}catch(e){}return r?'saved':'fail'}
  if(window.ViNative){ // old app: no PDF saving, save PNG to gallery instead
    var ok=0;for(var k=0;k<cards.length;k++){var c2=await draw(cards[k]);try{if(ViNative.save(c2.toDataURL('image/png').split(',')[1],'livecard-qr-'+cards[k].slug))ok++}catch(e){}}return ok?'png':'fail'}
  doc.save(fn);return 'saved'}
window.LCPrint={draw:draw,pdf:pdf,back:back};
})();
