/* Shared wedding-card details form (used by /card-builder/ and /card-order/) */
(function(){
var FIELDS=[
['bride','दुल्हन का नाम (जैसे: काजल सैनी) *','text',40],
['bride_parents','दुल्हन के माता-पिता (हर लाइन अलग)\nजैसे: श्रीमती रीना सैनी एवं / श्री विनोद कुमार सैनी','area',160],
['groom','दूल्हे का नाम (जैसे: दिव्यांशु सैनी) *','text',40],
['groom_parents','दूल्हे के माता-पिता और गाँव (हर लाइन अलग)','area',160],
['wed_date','शादी की तारीख *','date',10],
['ev1_title','कार्यक्रम 1 का नाम (जैसे: महिला संगीत)','text',30],
['ev1_text','कार्यक्रम 1 का दिन, तारीख, समय (हर लाइन अलग)','area',110],
['ev2_title','कार्यक्रम 2 का नाम (जैसे: बारात)','text',30],
['ev2_text','कार्यक्रम 2 का दिन, तारीख, समय','area',110],
['ev3_title','कार्यक्रम 3 का नाम (जैसे: प्रीतिभोज)','text',30],
['ev3_text','कार्यक्रम 3 का दिन, तारीख, समय','area',110],
['venue','विवाह स्थल का नाम (जैसे: ग्राम मीरपुर) *','text',60],
['address','पता (जैसे: पो० बेहट, जिला सहारनपुर)','text',100],
['maps','Google Maps लिंक','url',300],
['call1_name','पहले संपर्क का नाम','text',30],
['call1','पहला मोबाइल नंबर *','tel',10],
['call2_name','दूसरे संपर्क का नाम','text',30],
['call2','दूसरा मोबाइल नंबर','tel',10],
['family','परिवार का नाम (जैसे: समस्त सैनी परिवार)','text',40]
];
var TPL=[['1','शाही लाल (फ़ोटो वाला)'],['2','हरा सुनहरा'],['3','नेवी सुनहरा'],['4','गुलाबी'],['5','केसरिया']];
var css='.cfm label{display:block;font-size:13px;color:#7a6248;margin-top:12px;white-space:pre-line}.cfm input,.cfm textarea{font:inherit;padding:12px;border-radius:10px;border:1px solid #e8d5ad;width:100%;background:#fff;color:#2b1a14}'
+'.tpls{display:flex;gap:10px;overflow-x:auto;padding:6px 2px 10px;scroll-snap-type:x mandatory}.tp{flex:0 0 132px;scroll-snap-align:start;border:3px solid #e8d5ad;border-radius:12px;padding:6px;text-align:center;font-size:12.5px;background:#fff;position:relative}'
+'.tp img{width:100%;height:170px;object-fit:cover;object-position:top;border-radius:8px;display:block;background:#f3e9d2}.tp b{display:block;margin-top:6px;color:#2b1a14}.tp.on{border-color:#8b1a2b;box-shadow:0 0 0 2px #8b1a2b33}'
+'.tp.on:after{content:"\\2714  चुना हुआ";display:block;color:#8b1a2b;font-weight:700;margin-top:2px}.tp button{margin-top:6px;width:100%;padding:7px;border-radius:8px;border:1px solid #8b1a2b;background:#fff;color:#8b1a2b;font:inherit;font-size:12.5px;font-weight:600}'
+'#tpv{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99;display:none;flex-direction:column;align-items:center;padding:10px}#tpv.on{display:flex}#tpv iframe{flex:1;width:min(100%,460px);border:0;border-radius:12px;background:#fff}#tpv .bar{display:flex;gap:8px;width:min(100%,460px);margin-bottom:8px}#tpv .bar button{flex:1;padding:12px;border-radius:10px;border:0;font:inherit;font-weight:700}';
window.CardForm=function(mount){
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  var h='<div class="cfm"><label>डिज़ाइन चुनें (बाएँ-दाएँ सरकाएँ, "देखें" दबाकर पूरा कार्ड देखें)</label><div class="tpls">'+TPL.map(function(t,i){return '<div class="tp'+(i==0?' on':'')+'" data-t="'+t[0]+'"><img loading="lazy" src="/tpl-preview/t'+t[0]+'.jpg" alt=""><b>'+t[1]+'</b><button type="button" data-pv="'+t[0]+'">देखें</button></div>'}).join('')+'</div>';
  FIELDS.forEach(function(f){var a=f[2]=='area';h+='<label for="cf_'+f[0]+'">'+f[1]+'</label>'+(a?'<textarea rows="3" ':'<input type="'+(f[2]=='tel'?'tel" inputmode="numeric':f[2])+'" ')+'id="cf_'+f[0]+'" maxlength="'+f[3]+'">'+(a?'</textarea>':'')});
  mount.innerHTML=h+'</div>';
  var tpl='1';
  var pv=document.createElement('div');pv.id='tpv';pv.innerHTML='<div class="bar"><button type="button" id="tpvp" style="background:#8b1a2b;color:#fff">यही डिज़ाइन चुनें</button><button type="button" id="tpvc" style="background:#fff">बंद करें</button></div><iframe></iframe>';document.body.appendChild(pv);
  var cur='1';function pick(n){tpl=n;mount.querySelectorAll('.tp').forEach(function(x){x.classList.toggle('on',x.dataset.t===n)})}
  pv.querySelector('#tpvc').onclick=function(){pv.classList.remove('on');pv.querySelector('iframe').src='about:blank'};
  pv.querySelector('#tpvp').onclick=function(){pick(cur);pv.classList.remove('on');pv.querySelector('iframe').src='about:blank'};
  mount.addEventListener('click',function(e){var v=e.target.closest('[data-pv]');if(v){cur=v.dataset.pv;pv.querySelector('iframe').src='/wedding-t/?demo='+cur;pv.classList.add('on');return}var t=e.target.closest('.tp');if(t)pick(t.dataset.t)});
  return {get:function(){var d={tpl:tpl};FIELDS.forEach(function(f){d[f[0]]=document.getElementById('cf_'+f[0]).value});return d},set:function(o){FIELDS.forEach(function(f){var v=o&&o[f[0]];if(v!=null&&String(v).trim())document.getElementById('cf_'+f[0]).value=String(v)})},reset:function(){FIELDS.forEach(function(f){document.getElementById('cf_'+f[0]).value=''})}};
};
})();
