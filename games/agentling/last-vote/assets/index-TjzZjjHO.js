(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();const V=[{id:"arin",name:"아린",traits:["loyal","bold"],wish:"동료와 함께 살아남기",secretGoal:"보라를 마지막까지 지킨다"},{id:"bora",name:"보라",traits:["empathetic","cautious"],wish:"모두에게 신뢰받기",secretGoal:"누구에게도 첫 표를 받지 않는다"},{id:"chul",name:"철",traits:["greedy","suspicious"],wish:"가장 많은 식량 모으기",secretGoal:"아린보다 오래 살아남는다"},{id:"dana",name:"다나",traits:["bold","suspicious"],wish:"배신자를 찾아내기",secretGoal:"최종 투표를 주도한다"},{id:"eun",name:"은",traits:["loyal","empathetic"],wish:"친구를 만들기",secretGoal:"적어도 한 명에게 변호받는다"},{id:"finn",name:"핀",traits:["greedy","cautious"],wish:"무사히 살아남기",secretGoal:"누구도 먼저 비난하지 않는다"}],C=[{id:"arrival",title:"첫인상",kind:"mission"},{id:"supplies",title:"부족한 식량",kind:"resource"},{id:"rumor",title:"창고의 소문",kind:"accusation"},{id:"last-plea",title:"마지막 호소",kind:"plea"}];function P(e){let s=2166136261;for(let t=0;t<e.length;t+=1)s^=e.charCodeAt(t),s=Math.imul(s,16777619);return s>>>0}function R(e){let s=P(e);return{next(){s+=1831565813;let t=s;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296},pick(t){if(t.length===0)throw new Error("Cannot pick from an empty list");return t[Math.floor(this.next()*t.length)]}}}const _=-5,q=5;function j(e){return Math.max(_,Math.min(q,e))}function H(e){return Object.fromEntries(e.map(s=>[s.id,Object.fromEntries(e.filter(t=>t.id!==s.id).map(t=>[t.id,{trust:0,affinity:0,fear:0}]))]))}function U(e,s){if(/동료|친구|구해|버리지|함께/.test(e))return s.kind==="resource"?"share":s.kind==="accusation"||s.kind==="plea"?"defend":"cooperate";if(/믿지|의심|배신/.test(e)&&(s.kind==="accusation"||s.kind==="plea"))return"accuse";if(/도망|숨|살아남/.test(e))return"abstain"}function G(e,s,t){const r=[];return s.kind==="mission"&&r.push(e.traits.includes("cautious")?"abstain":"cooperate"),s.kind==="resource"&&r.push(e.traits.includes("greedy")?"hoard":"share"),s.kind==="accusation"&&r.push(e.traits.includes("suspicious")?"accuse":"defend"),s.kind==="plea"&&r.push(e.traits.includes("loyal")||e.traits.includes("empathetic")?"defend":"accuse"),e.traits.includes("bold")&&s.kind!=="resource"&&r.push("accuse"),t.pick(r)}function D(e,s,t,r){const a=e.id===t.playerId?U(t.advice,s):void 0,n=a??G(e,s,r),i=t.cast.filter(N=>N.id!==e.id),o=r.pick(i),l=n==="hoard"||n==="abstain"?void 0:o.id,p={cooperate:`${o.name}, 같이 하자.`,share:`${o.name}에게 내 몫을 나눌게.`,hoard:"지금은 내 몫부터 지켜야 해.",accuse:`${o.name}, 네 설명은 믿기 어려워.`,defend:`${o.name}, 함부로 몰아가면 안 돼.`,abstain:"이번에는 나서지 않겠어."};return{actorId:e.id,action:n,targetId:l,speech:p[n],emotion:n==="accuse"?"angry":n==="abstain"||n==="hoard"?"anxious":"hopeful",adviceInfluenced:a!==void 0}}function h(e,s,t,r,a,n,i){const o=e[t]?.[r];if(!o)return;const l=o[a],p=j(l+n);o[a]=p,s.push({fromId:t,toId:r,field:a,before:l,after:p,reason:i})}function F(e,s,t,r){const a=e.targetId;if(e.action==="hoard"){for(const n of s.filter(i=>i.id!==e.actorId))h(t,r,n.id,e.actorId,"trust",-1,e.action);return}a&&(e.action==="cooperate"?h(t,r,a,e.actorId,"trust",1,e.action):e.action==="share"||e.action==="defend"?(h(t,r,a,e.actorId,"trust",2,e.action),h(t,r,a,e.actorId,"affinity",1,e.action)):e.action==="accuse"&&(h(t,r,a,e.actorId,"trust",-2,e.action),h(t,r,a,e.actorId,"fear",1,e.action)))}function W(e,s){return e.map(t=>{const r=e.filter(a=>a.id!==t.id).map(a=>{const n=s[t.id][a.id];return{candidate:a,score:n.trust+n.affinity-n.fear}}).sort((a,n)=>a.score-n.score||a.candidate.id.localeCompare(n.candidate.id));return{voterId:t.id,targetId:r[0].candidate.id,score:r[0].score}})}function B(e){const s=new Map;for(const t of e)s.set(t.targetId,(s.get(t.targetId)??0)+1);return[...s.entries()].sort((t,r)=>r[1]-t[1]||t[0].localeCompare(r[0]))[0][0]}function X(e){if(e.cast.length<3)throw new Error("Last Vote requires at least three characters");if(!e.cast.some(i=>i.id===e.playerId))throw new Error("playerId must exist in cast");const s=R(e.seed),t=H(e.cast),r=e.scenes.map(i=>{const o=e.cast.map(p=>D(p,i,e,s)),l=[];for(const p of o)F(p,e.cast,t,l);return{sceneId:i.id,title:i.title,intents:o,deltas:l}}),a=W(e.cast,t),n=B(a);return{replayVersion:"0.1",rulesVersion:"0.1",seed:e.seed,playerId:e.playerId,advice:e.advice,cast:e.cast,scenes:r,votes:a,exiledId:n,playerSurvived:n!==e.playerId,relationships:t}}function E(e){return JSON.parse(JSON.stringify(e))}function Y(e){if(!e||typeof e!="object"||!("type"in e))return!1;const s=e;return s.type==="select_agent"?typeof s.agentId=="string":s.type==="set_advice"?typeof s.advice=="string":s.type==="start"||s.type==="advance"||s.type==="replay"||s.type==="new_season"}function z(e,s=()=>{}){const t={game:"agentling-last-vote",version:"1.0",getState:()=>E(e.getState()),getActions:()=>E(e.getActions()),dispatch:r=>{const a=e.isTerminal(),n=Y(r)?E(r):null,i=n?e.dispatch(n):!1;return s("agent:step",{game:t.game,action:n,changed:i,terminal:e.isTerminal(),score:e.getScore(),wasTerminal:a}),i},reset:r=>e.reset(r),isTerminal:()=>e.isTerminal(),getScore:()=>e.getScore(),captureFrame:()=>null,observe:()=>({game:t.game,state:t.getState(),actions:t.getActions(),terminal:t.isTerminal(),score:t.getScore()})};return t}function J(e){const s=(r,a)=>window.dispatchEvent(new CustomEvent(r,{detail:a})),t=z(e,s);return window.Agent=t,document.documentElement.dataset.agentApi=`${t.game}@${t.version}`,s("agent:ready",{game:t.game,version:t.version}),t}function K(e){const s=new Map;for(const t of e.votes)s.set(t.targetId,(s.get(t.targetId)??0)+1);return e.cast.map(t=>({agentId:t.id,count:s.get(t.id)??0})).sort((t,r)=>r.count-t.count||t.agentId.localeCompare(r.agentId))}function x(e){const s=e.cast.find(i=>i.id===e.playerId),t=e.cast.find(i=>i.id===e.exiledId),r=e.scenes.flatMap(i=>i.intents).filter(i=>i.actorId===e.playerId&&i.adviceInfluenced),a={cooperate:"협력으로",share:"나눔으로",hoard:"독점으로",accuse:"의심으로",defend:"변호로",abstain:"회피로"},n=r[0]?a[r[0].action]:"자기 방식";return e.playerSurvived?`“${e.advice}” — ${s.name}의 선택은 ${n} 드러났고, 마지막 표는 ${t.name}에게 향했다.`:`“${e.advice}” — ${s.name}의 선택은 ${n} 드러났고, 그 원칙은 결국 자신을 저택 밖으로 밀어냈다.`}const $=V,w=C,M=document.querySelector("#app");if(!M)throw new Error("Missing #app root");const L=M,O="last-vote-browser-001",I=["보물보다 동료를 먼저 구해.","사람을 너무 쉽게 믿지 마.","불리하면 무조건 도망가."],S={arin:"#ffb84d",bora:"#68d9c8",chul:"#f07167",dana:"#9b8cff",eun:"#8bd450",finn:"#69a7ff"},Q={cooperate:"협력",share:"나눔",hoard:"독점",accuse:"의심",defend:"변호",abstain:"회피"},Z={cooperate:"↗",share:"◇",hoard:"■",accuse:"!",defend:"+",abstain:"…"};let v="arin",u=I[0],T=O,c=null,d=0;function y(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function f(e){const s=$.find(t=>t.id===e);if(!s)throw new Error(`Unknown agent: ${e}`);return s}function k(e,s){return`
    <div class="noise" aria-hidden="true"></div>
    <header class="topbar">
      <a class="brand" href="#" aria-label="Agentling Last Vote 처음으로">
        <span class="brand-mark">A</span>
        <span>AGENTLING</span>
      </a>
      <div class="season-label"><span class="live-dot"></span> LAST VOTE / S01</div>
      <div class="build-label">DETERMINISTIC BUILD 0.1</div>
    </header>
    <main class="game-shell ${s}">${e}</main>
    <footer>
      <span>Built with Codex</span>
      <span>Seeded replay · No API key · No login</span>
    </footer>
  `}function m(){const e=$.map((t,r)=>`
        <button class="character-card ${t.id===v?"selected":""}"
          data-agent="${t.id}" style="--agent:${S[t.id]}" aria-pressed="${t.id===v}">
          <span class="character-index">0${r+1}</span>
          <span class="avatar">${t.name.slice(0,1)}</span>
          <span class="character-copy">
            <strong>${t.name}</strong>
            <small>${t.traits.join(" · ")}</small>
          </span>
          <span class="selector">${t.id===v?"✓":"+"}</span>
        </button>`).join(""),s=I.map((t,r)=>`
        <button class="advice-card ${t===u?"selected":""}" data-advice="${y(t)}">
          <span>0${r+1}</span>
          <strong>“${y(t)}”</strong>
        </button>`).join("");L.innerHTML=k(`
      <section class="setup-layout">
        <div class="setup-main">
          <div class="eyebrow">A SOCIAL SURVIVAL EXPERIMENT</div>
          <h1>한 문장이<br><em>마지막 표</em>를 바꾼다.</h1>
          <p class="lead">당신의 캐릭터는 여섯 명이 모인 저택에 들어갑니다. 한 가지 원칙만 가르치고, 누가 그 대가를 치르는지 지켜보세요.</p>

          <div class="step-heading"><span>01</span><div><strong>내 캐릭터</strong><small>이 원칙을 기억할 한 명을 선택하세요.</small></div></div>
          <div class="character-grid">${e}</div>

          <div class="step-heading"><span>02</span><div><strong>단 하나의 조언</strong><small>장면마다 같은 말이 다르게 작동합니다.</small></div></div>
          <div class="advice-grid">${s}</div>
          <label class="custom-advice">
            <span>CUSTOM WHISPER</span>
            <textarea id="custom-advice" maxlength="80" rows="2" placeholder="동료, 믿지 마, 도망 같은 원칙을 직접 남겨보세요.">${I.includes(u)?"":y(u)}</textarea>
          </label>
        </div>

        <aside class="mission-card">
          <div class="mission-top"><span>LAST VOTE</span><span>04 SCENES</span></div>
          <div class="mission-symbol">LV</div>
          <h2>폐쇄된 저택.<br>여섯 명.<br>단 한 번의 추방.</h2>
          <dl>
            <div><dt>참가자</dt><dd>6</dd></div>
            <div><dt>당신의 개입</dt><dd>1 문장</dd></div>
            <div><dt>결말</dt><dd>1 추방</dd></div>
          </dl>
          <button id="start-season" class="primary-action">시즌 시작 <span>→</span></button>
          <p>약 3분 · 모든 결과는 규칙과 seed로 재현됩니다.</p>
        </aside>
      </section>`,"setup-mode"),document.querySelectorAll("[data-agent]").forEach(t=>{t.addEventListener("click",()=>{g({type:"select_agent",agentId:t.dataset.agent})})}),document.querySelectorAll("[data-advice]").forEach(t=>{t.addEventListener("click",()=>{g({type:"set_advice",advice:t.dataset.advice})})}),document.querySelector("#custom-advice")?.addEventListener("input",t=>{const r=t.currentTarget.value.trim();r&&(u=r)}),document.querySelector("#start-season")?.addEventListener("click",()=>{g({type:"start"})})}function ee(){c=X({seed:T,playerId:v,advice:u,cast:$,scenes:w}),d=0,A()}function b(){return c?d>=c.scenes.length?"ending":"scene":"setup"}function te(){const e=b();return{phase:e,seed:T,playerId:v,advice:u,sceneIndex:e==="scene"?d:null,sceneCount:w.length,revealedScenes:c?c.scenes.slice(0,Math.min(d+1,c.scenes.length)):[],result:e==="ending"?c:null}}function se(){const e=b();return e==="setup"?[...$.map(s=>({type:"select_agent",agentId:s.id})),...I.map(s=>({type:"set_advice",advice:s})),{type:"start"}]:e==="scene"?[{type:"advance"}]:[{type:"replay"},{type:"new_season"}]}function g(e){const s=b();if(s==="setup"&&e.type==="select_agent"&&$.some(t=>t.id===e.agentId))return v===e.agentId?!1:(v=e.agentId,m(),!0);if(s==="setup"&&e.type==="set_advice"){const t=e.advice.trim().slice(0,80);return!t||t===u?!1:(u=t,m(),!0)}return s==="setup"&&e.type==="start"?(ee(),!0):s==="scene"&&e.type==="advance"?(d+=1,A(),!0):s==="ending"&&e.type==="replay"?(d=0,A(),!0):s==="ending"&&e.type==="new_season"?(c=null,d=0,m(),!0):!1}function ae(e){T=e===void 0?O:String(e),v="arin",u=I[0],c=null,d=0,m()}function ne(){return w.map((e,s)=>`<span class="progress-node ${s<=d?"active":""}">
        <i></i><small>0${s+1}</small>
      </span>`).join("")}function A(){if(!c)return m();if(d>=c.scenes.length)return re();const e=c.scenes[d],s=f(c.playerId),t=e.intents.map(a=>{const n=f(a.actorId),i=a.targetId?f(a.targetId):null;return`
        <article class="intent-card ${a.actorId===c.playerId?"player-intent":""}" style="--agent:${S[n.id]}">
          <div class="intent-avatar">${n.name.slice(0,1)}</div>
          <div class="intent-copy">
            <div class="intent-meta"><strong>${n.name}</strong><span>${Q[a.action]} ${Z[a.action]}</span></div>
            <p>“${y(a.speech)}”</p>
            ${i?`<small>대상 · ${i.name}</small>`:"<small>대상 · 없음</small>"}
          </div>
          ${a.adviceInfluenced?'<div class="whisper-badge">YOUR WHISPER</div>':""}
        </article>`}).join(""),r=e.deltas.slice(0,7).map(a=>{const n=f(a.fromId),i=f(a.toId),o=a.after-a.before,l=a.field==="trust"?"신뢰":a.field==="affinity"?"호감":"두려움";return`<li><span>${n.name} → ${i.name}</span><strong class="${o>=0?"positive":"negative"}">${l} ${o>0?"+":""}${o}</strong></li>`}).join("");L.innerHTML=k(`
      <section class="scene-layout">
        <div class="scene-header">
          <div><span class="eyebrow">SCENE 0${d+1} / 04</span><h1>${e.title}</h1></div>
          <blockquote><span>${s.name}에게 남긴 원칙</span>“${y(c.advice)}”</blockquote>
        </div>
        <div class="progress-track">${ne()}</div>
        <div class="scene-columns">
          <div class="intent-feed"><div class="column-label">LIVE FEED <span>행동은 동시에 결정되었습니다.</span></div>${t}</div>
          <aside class="evidence-panel">
            <div class="column-label">RULE EVIDENCE <span>대사가 아닌 코드가 바꾼 값</span></div>
            <ul>${r||"<li>관계 변화 없음</li>"}</ul>
            <div class="evidence-note"><strong>왜 이렇게 됐나요?</strong><p>각 행동은 고정된 관계 규칙으로 해결됩니다. 생성된 표현은 점수나 승패를 바꿀 수 없습니다.</p></div>
            <button id="next-scene" class="primary-action">${d===c.scenes.length-1?"마지막 투표":"다음 장면"} <span>→</span></button>
          </aside>
        </div>
      </section>`,"scene-mode"),document.querySelector("#next-scene")?.addEventListener("click",()=>{g({type:"advance"})})}function re(){if(!c)return m();const e=f(c.playerId),s=f(c.exiledId),t=K(c),r=Math.max(...t.map(n=>n.count),1),a=t.map(n=>{const i=f(n.agentId);return`<li class="${n.agentId===c.exiledId?"exiled":""}">
        <span class="vote-avatar" style="--agent:${S[i.id]}">${i.name.slice(0,1)}</span>
        <strong>${i.name}</strong>
        <div class="vote-bar"><i style="width:${n.count/r*100}%"></i></div>
        <b>${n.count}표</b>
      </li>`}).join("");L.innerHTML=k(`
      <section class="ending-layout ${c.playerSurvived?"survived":"eliminated"}">
        <div class="ending-copy">
          <span class="eyebrow">FINAL RESULT / REPLAY ${c.seed.toUpperCase()}</span>
          <p class="verdict">${c.playerSurvived?"SURVIVED":"EXILED"}</p>
          <h1>${s.name},<br><em>저택을 떠나다.</em></h1>
          <p class="story">${y(x(c))}</p>
          <div class="ending-actions">
            <button id="share-story" class="primary-action">결말 문장 복사 <span>↗</span></button>
            <button id="replay-season" class="secondary-action">같은 시즌 다시 보기</button>
            <button id="new-season" class="text-action">다른 원칙 남기기</button>
          </div>
        </div>
        <aside class="vote-panel">
          <div class="vote-stamp"><span>LAST</span><strong>VOTE</strong></div>
          <div class="owned-agent"><span>내 캐릭터</span><strong style="--agent:${S[e.id]}">${e.name}</strong><b>${c.playerSurvived?"생존":"추방"}</b></div>
          <div class="column-label">VOTE TALLY <span>동률은 ID 순으로 결정</span></div>
          <ol>${a}</ol>
        </aside>
      </section>`,"ending-mode"),document.querySelector("#replay-season")?.addEventListener("click",()=>{g({type:"replay"})}),document.querySelector("#new-season")?.addEventListener("click",()=>{g({type:"new_season"})}),document.querySelector("#share-story")?.addEventListener("click",async n=>{const i=n.currentTarget;try{await navigator.clipboard.writeText(x(c)),i.innerHTML="복사 완료 <span>↗</span>"}catch{i.innerHTML="복사할 수 없음 <span>↗</span>"}})}m();J({getState:te,getActions:se,dispatch:g,reset:ae,isTerminal:()=>b()==="ending",getScore:()=>b()==="ending"&&c?.playerSurvived?1:0});
