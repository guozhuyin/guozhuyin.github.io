(()=>{
 const toggle=document.querySelector('[data-theme-toggle]');
 if(toggle){
  const system=window.matchMedia('(prefers-color-scheme: dark)');
  let preference='system';
  try{const saved=localStorage.getItem('mypage-theme');if(['light','dark'].includes(saved))preference=saved;}catch{}
  const currentDark=()=>preference==='dark'||preference==='system'&&system.matches;
  const render=()=>{
   const systemTheme=system.matches?'dark':'light';
   if(preference===systemTheme){preference='system';try{localStorage.removeItem('mypage-theme');}catch{}}
   const dark=currentDark();
   if(preference==='system')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=preference;
   toggle.hidden=false;toggle.setAttribute('aria-pressed',String(dark));
   toggle.querySelector('[data-theme-icon]').textContent=dark?'☀':'☾';
   toggle.title=(dark?toggle.dataset.lightLabel:toggle.dataset.darkLabel)+(preference==='system'?` · ${toggle.dataset.systemLabel}`:'');
  };
  toggle.addEventListener('click',()=>{
   preference=currentDark()?'light':'dark';
   try{localStorage.setItem('mypage-theme',preference);}catch{}
   render();
  });
  system.addEventListener('change',render);
  window.addEventListener('storage',event=>{if(event.key==='mypage-theme'||event.key===null){preference=['light','dark'].includes(event.newValue)?event.newValue:'system';render();}});
  render();
 }
 const picker=document.querySelector('.language-picker');
 if(picker){document.addEventListener('keydown',event=>{if(event.key==='Escape'&&picker.open){picker.open=false;picker.querySelector('summary').focus();}});document.addEventListener('click',event=>{if(!picker.contains(event.target))picker.open=false;});}
})();
