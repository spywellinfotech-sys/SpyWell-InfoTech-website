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
var TPL=[['1','शाही लाल','#8b1a2b','#f2b134'],['2','हरा सुनहरा','#0f5a43','#c9a24a'],['3','नेवी सुनहरा','#14284f','#d4af37'],['4','गुलाबी','#a23559','#e8a3b5']];
var css='.cfm label{display:block;font-size:13px;color:#7a6248;margin-top:12px;white-space:pre-line}.cfm input,.cfm textarea{font:inherit;padding:12px;border-radius:10px;border:1px solid #e8d5ad;width:100%;background:#fff;color:#2b1a14}'
+'.tpls{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}.tp{border:2px solid #e8d5ad;border-radius:12px;padding:8px 2px;text-align:center;font-size:12px;background:#fff;cursor:pointer}.tp i{display:block;height:34px;border-radius:8px;margin-bottom:4px}.tp.on{border-color:#8b1a2b;box-shadow:0 0 0 2px #8b1a2b33}';
window.CardForm=function(mount){
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  var h='<div class="cfm"><label>डिज़ाइन चुनें</label><div class="tpls">'+TPL.map(function(t,i){return '<div class="tp'+(i==0?' on':'')+'" data-t="'+t[0]+'"><i style="background:linear-gradient(135deg,'+t[2]+' 55%,'+t[3]+' 55%)"></i>'+t[1]+'</div>'}).join('')+'</div>';
  FIELDS.forEach(function(f){var a=f[2]=='area';h+='<label for="cf_'+f[0]+'">'+f[1]+'</label>'+(a?'<textarea rows="3" ':'<input type="'+(f[2]=='tel'?'tel" inputmode="numeric':f[2])+'" ')+'id="cf_'+f[0]+'" maxlength="'+f[3]+'">'+(a?'</textarea>':'')});
  mount.innerHTML=h+'</div>';
  var tpl='1';
  mount.addEventListener('click',function(e){var t=e.target.closest('.tp');if(!t)return;tpl=t.dataset.t;mount.querySelectorAll('.tp').forEach(function(x){x.classList.toggle('on',x===t)})});
  return {get:function(){var d={tpl:tpl};FIELDS.forEach(function(f){d[f[0]]=document.getElementById('cf_'+f[0]).value});return d},reset:function(){FIELDS.forEach(function(f){document.getElementById('cf_'+f[0]).value=''})}};
};
})();
