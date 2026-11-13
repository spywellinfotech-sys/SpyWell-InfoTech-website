(function(){try{
  if(window.top!==window)return;
  if(!(window.Capacitor||/; wv\)/.test(navigator.userAgent)))return;
  if(location.pathname.replace(/\/+$/,'')==='/studio')return;
  history.pushState({ab:1},'');
  window.addEventListener('popstate',function(){location.replace('/studio/')});
}catch(e){}})();
