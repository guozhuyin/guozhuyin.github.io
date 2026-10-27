(()=>{
 if(window.matchMedia('(max-width: 760px)').matches){
  document.querySelectorAll('.project-toc').forEach(toc=>{toc.open=false;});
 }
 const picker=document.querySelector('.language-picker');
 if(picker){
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&picker.open){picker.open=false;picker.querySelector('summary').focus();}
  });
  document.addEventListener('click',event=>{if(!picker.contains(event.target))picker.open=false;});
 }
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
   const icon=toggle.querySelector('[data-theme-icon]');
   if(!icon.querySelector?.('svg'))icon.textContent=dark?'☀':'☾';
   toggle.setAttribute('aria-label',dark?toggle.dataset.lightLabel:toggle.dataset.darkLabel);
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
 // Animate on entry without hiding content before JavaScript runs.
 if('IntersectionObserver' in window){
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const active=new Set();let observer;
  const stop=()=>{observer?.disconnect();active.forEach(animation=>animation.cancel());active.clear();};
  const start=()=>{
   stop();if(motion.matches)return;
   observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
     if(!entry.isIntersecting)return;
     observer.unobserve(entry.target);
     if(typeof entry.target.animate!=='function')return;
     const animation=entry.target.animate(
      [{opacity:.35,transform:'translateY(12px)'},{opacity:1,transform:'none'}],
      {duration:480,easing:'cubic-bezier(.2,.7,.3,1)'}
     );
     active.add(animation);animation.onfinish=animation.oncancel=()=>active.delete(animation);
    });
   },{threshold:0,rootMargin:'0px 0px -24px 0px'});
   document.querySelectorAll('.hero-heading,.project-card,.about-strip-inner,.home-writing,.about-intro,.writing-row').forEach(el=>observer.observe(el));
  };
  motion.addEventListener('change',start);window.addEventListener('beforeprint',stop);start();
 }
})();
