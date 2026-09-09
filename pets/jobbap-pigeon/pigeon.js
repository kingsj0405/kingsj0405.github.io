(() => {
  'use strict';
  const states = {
    idle: {row:0, durations:[280,110,110,140,140,320], label:'기본'},
    'running-right': {row:1, durations:[120,120,120,120,120,120,120,220], label:'오른쪽으로'},
    'running-left': {row:2, durations:[120,120,120,120,120,120,120,220], label:'왼쪽으로'},
    waving: {row:3, durations:[140,140,140,280], label:'인사'},
    jumping: {row:4, durations:[140,140,140,140,280], label:'폴짝'},
    failed: {row:5, durations:[140,140,140,140,140,140,140,240], label:'시무룩'},
    waiting: {row:6, durations:[150,150,150,150,150,260], label:'기다리는 중'},
    running: {row:7, durations:[120,120,120,120,120,220], label:'일하는 중'},
    review: {row:8, durations:[150,150,150,150,150,280], label:'살펴보는 중'}
  };
  const labels=['위','위·오른쪽 22.5°','위·오른쪽 45°','위·오른쪽 67.5°','오른쪽','아래·오른쪽 112.5°','아래·오른쪽 135°','아래·오른쪽 157.5°','아래','아래·왼쪽 202.5°','아래·왼쪽 225°','아래·왼쪽 247.5°','왼쪽','위·왼쪽 292.5°','위·왼쪽 315°','위·왼쪽 337.5°'];
  const byId=id=>document.getElementById(id);
  const sprite=byId('pet-sprite'), stage=byId('sprite-stage'), slider=byId('gaze');
  const buttons=[...document.querySelectorAll('[data-state]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current='idle', frame=0, timer, paused=reduced.matches, lookNeutral=false;
  const draw=(row,col)=>{sprite.style.backgroundPosition=`${col/7*100}% ${row/10*100}%`;};
  function schedule(){
    clearTimeout(timer);
    if((current==='look'&&!lookNeutral)||paused||document.hidden)return;
    const s=states[current==='look'?'idle':current];
    timer=setTimeout(()=>{frame=(frame+1)%s.durations.length;draw(s.row,frame);schedule();},s.durations[frame]);
  }
  function gaze(index){
    lookNeutral=false;clearTimeout(timer);
    index=((index%16)+16)%16;
    draw(9+Math.floor(index/8),index%8);
    slider.value=index;
    slider.setAttribute('aria-valuetext',labels[index]);
    byId('gaze-label').textContent=labels[index];
    byId('preview-state').textContent=labels[index];
  }
  function neutral(){
    if(lookNeutral)return;
    lookNeutral=true;frame=0;draw(0,0);
    byId('gaze-label').textContent='기본 (중앙)';
    byId('preview-state').textContent='기본';
    slider.setAttribute('aria-valuetext','기본 (중앙)');
    schedule();
  }
  function select(name){
    if(name!=='look'&&!states[name])return;
    current=name;frame=0;lookNeutral=false;clearTimeout(timer);
    buttons.forEach(b=>{const active=b.dataset.state===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    byId('gaze-controls').hidden=name!=='look';
    if(name==='look')gaze(Number(slider.value));
    else{draw(states[name].row,0);byId('preview-state').textContent=states[name].label;schedule();}
  }
  function updatePause(){byId('pause').textContent=paused?'애니메이션 재생':'애니메이션 멈추기';byId('pause').setAttribute('aria-pressed',String(paused));schedule();}
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.state)));
  slider.addEventListener('input',()=>gaze(Number(slider.value)));
  stage.addEventListener('pointermove',event=>{
    if(current!=='look')return;
    const rect=sprite.getBoundingClientRect(),dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);
    if(Math.hypot(dx,dy)<24){neutral();return;}
    const degrees=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
    gaze(Math.round(degrees/22.5)%16);
  });
  stage.addEventListener('pointerleave',()=>{if(current==='look')neutral();});
  byId('pause').addEventListener('click',()=>{paused=!paused;updatePause();});
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',()=>{paused=reduced.matches;updatePause();});
  async function copy(text){
    try{await navigator.clipboard.writeText(text);byId('copy-status').textContent='복사했어요.';}
    catch{byId('copy-status').textContent='자동 복사가 안 돼요. 링크나 설치 문장을 직접 선택해 복사해주세요.';}
  }
  byId('copy-link').addEventListener('click',()=>copy('https://yangspace.co.kr/pets/jobbap-pigeon/'));
  byId('copy-prompt').addEventListener('click',()=>copy(byId('install-prompt').textContent.trim()));
  draw(0,0);updatePause();
})();
