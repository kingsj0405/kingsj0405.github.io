(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function t(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(a){if(a.ep)return;a.ep=!0;const i=t(a);fetch(a.href,i)}})();const F=[{id:"arin",name:"아린",traits:["loyal","bold"],wish:"동료와 함께 살아남기",secretGoal:"보라를 마지막까지 지킨다"},{id:"bora",name:"보라",traits:["empathetic","cautious"],wish:"모두에게 신뢰받기",secretGoal:"누구에게도 첫 표를 받지 않는다"},{id:"chul",name:"철",traits:["greedy","suspicious"],wish:"가장 많은 식량 모으기",secretGoal:"아린보다 오래 살아남는다"},{id:"dana",name:"다나",traits:["bold","suspicious"],wish:"배신자를 찾아내기",secretGoal:"최종 투표를 주도한다"},{id:"eun",name:"은",traits:["loyal","empathetic"],wish:"친구를 만들기",secretGoal:"적어도 한 명에게 변호받는다"},{id:"finn",name:"핀",traits:["greedy","cautious"],wish:"무사히 살아남기",secretGoal:"누구도 먼저 비난하지 않는다"}],G=[{id:"arrival",title:"첫인상",kind:"mission"},{id:"supplies",title:"부족한 식량",kind:"resource"},{id:"rumor",title:"창고의 소문",kind:"accusation"},{id:"last-plea",title:"마지막 호소",kind:"plea"}],D={protect:"특정 인물 보호",distrust:"특정 인물 불신",group_first:"동료 우선",self_first:"내 몫 우선",escape:"위험 회피",neutral:"자율 판단"},z=new Set(["protect","distrust","group_first","self_first","escape","neutral"]);function J(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function U(e,s){const t=[...s].sort((n,a)=>a.name.length-n.name.length);for(const n of t){if(n.name.length>1&&e.includes(n.name))return n.id;const a=J(n.name),i=new RegExp(`(?:^|[\\s,])${a}(?:이|가|을|를|에게|한테|와|과|은|는|도|부터|$)`);if(n.name.length===1&&(e.trim()===n.name||i.test(e)))return n.id}}function k(e,s){const t=U(e,s);let n="neutral";return/보물.*동료|동료.*먼저|함께|협력|나눠|나누/.test(e)?n="group_first":/지켜|보호|구해|구하|희생|버리지/.test(e)?n="protect":/믿지|의심|배신|경계|고발/.test(e)?n="distrust":/도망|숨|살아남|회피|빠져나/.test(e)?n="escape":/독점|내 몫|혼자|챙겨/.test(e)&&(n="self_first"),{version:"0.1",kind:n,targetId:t,source:"rules",confidence:n==="neutral"?0:1}}function K(e,s){if(!e||typeof e!="object")return!1;const t=e;return!(t.version!=="0.1"||typeof t.kind!="string"||!z.has(t.kind)||t.source!=="rules"&&t.source!=="local-semantic"||typeof t.confidence!="number"||t.confidence<0||t.confidence>1||t.targetId!==void 0&&!s.some(n=>n.id===t.targetId))}function X(e,s){if(e.kind==="escape")return"abstain";if(e.kind==="self_first")return s.kind==="resource"?"hoard":void 0;if(e.kind==="distrust")return s.kind==="accusation"||s.kind==="plea"?"accuse":void 0;if(e.kind==="protect")return s.kind==="accusation"||s.kind==="plea"?"defend":s.kind==="resource"?"share":"cooperate";if(e.kind==="group_first")return s.kind==="resource"?"share":s.kind==="accusation"||s.kind==="plea"?"defend":"cooperate"}function Y(e){let s=2166136261;for(let t=0;t<e.length;t+=1)s^=e.charCodeAt(t),s=Math.imul(s,16777619);return s>>>0}function Q(e){let s=Y(e);return{next(){s+=1831565813;let t=s;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296},pick(t){if(t.length===0)throw new Error("Cannot pick from an empty list");return t[Math.floor(this.next()*t.length)]}}}const Z=-5,ee=5;function te(e){return Math.max(Z,Math.min(ee,e))}function se(e){return Object.fromEntries(e.map(s=>[s.id,Object.fromEntries(e.filter(t=>t.id!==s.id).map(t=>[t.id,{trust:0,affinity:0,fear:0}]))]))}function ne(e,s,t){const n=[];return s.kind==="mission"&&n.push(e.traits.includes("cautious")?"abstain":"cooperate"),s.kind==="resource"&&n.push(e.traits.includes("greedy")?"hoard":"share"),s.kind==="accusation"&&n.push(e.traits.includes("suspicious")?"accuse":"defend"),s.kind==="plea"&&n.push(e.traits.includes("loyal")||e.traits.includes("empathetic")?"defend":"accuse"),e.traits.includes("bold")&&s.kind!=="resource"&&n.push("accuse"),t.pick(n)}function ae(e,s,t,n){const a=t.advicePolicy,i=e.id===t.playerId?X(a,s):void 0,r=i??ne(e,s,n),c=t.cast.filter(M=>M.id!==e.id),d=n.pick(c),h=(i!==void 0&&e.id===t.playerId&&a.targetId&&a.targetId!==e.id?c.find(M=>M.id===a.targetId):void 0)??d,L=r==="hoard"||r==="abstain"?void 0:h.id,B={cooperate:`${h.name}, 같이 하자.`,share:`${h.name}에게 내 몫을 나눌게.`,hoard:"지금은 내 몫부터 지켜야 해.",accuse:`${h.name}, 네 설명은 믿기 어려워.`,defend:`${h.name}, 함부로 몰아가면 안 돼.`,abstain:"이번에는 나서지 않겠어."};return{actorId:e.id,action:r,targetId:L,speech:B[r],emotion:r==="accuse"?"angry":r==="abstain"||r==="hoard"?"anxious":"hopeful",adviceInfluenced:i!==void 0}}function E(e,s,t,n,a,i,r){const c=e[t]?.[n];if(!c)return;const d=c[a],A=te(d+i);c[a]=A,s.push({fromId:t,toId:n,field:a,before:d,after:A,reason:r})}function re(e,s,t,n){const a=e.targetId;if(e.action==="hoard"){for(const i of s.filter(r=>r.id!==e.actorId))E(t,n,i.id,e.actorId,"trust",-1,e.action);return}a&&(e.action==="cooperate"?E(t,n,a,e.actorId,"trust",1,e.action):e.action==="share"||e.action==="defend"?(E(t,n,a,e.actorId,"trust",2,e.action),E(t,n,a,e.actorId,"affinity",1,e.action)):e.action==="accuse"&&(E(t,n,a,e.actorId,"trust",-2,e.action),E(t,n,a,e.actorId,"fear",1,e.action)))}function ie(e,s){return e.map(t=>{const n=e.filter(a=>a.id!==t.id).map(a=>{const i=s[t.id][a.id];return{candidate:a,score:i.trust+i.affinity-i.fear}}).sort((a,i)=>a.score-i.score||a.candidate.id.localeCompare(i.candidate.id));return{voterId:t.id,targetId:n[0].candidate.id,score:n[0].score}})}function oe(e){const s=new Map;for(const t of e)s.set(t.targetId,(s.get(t.targetId)??0)+1);return[...s.entries()].sort((t,n)=>n[1]-t[1]||t[0].localeCompare(n[0]))[0][0]}function ce(e){if(e.cast.length<3)throw new Error("Last Vote requires at least three characters");if(!e.cast.some(d=>d.id===e.playerId))throw new Error("playerId must exist in cast");const s=K(e.advicePolicy,e.cast)?e.advicePolicy:k(e.advice,e.cast),t={...e,advicePolicy:s},n=Q(e.seed),a=se(e.cast),i=e.scenes.map(d=>{const A=e.cast.map(L=>ae(L,d,t,n)),h=[];for(const L of A)re(L,e.cast,a,h);return{sceneId:d.id,title:d.title,intents:A,deltas:h}}),r=ie(e.cast,a),c=oe(r);return{replayVersion:"0.2",rulesVersion:"0.2",seed:e.seed,playerId:e.playerId,advice:e.advice,advicePolicy:s,cast:e.cast,scenes:i,votes:r,exiledId:c,playerSurvived:c!==e.playerId,relationships:a}}function C(e){return JSON.parse(JSON.stringify(e))}function de(e){if(!e||typeof e!="object"||!("type"in e))return!1;const s=e;return s.type==="select_agent"?typeof s.agentId=="string":s.type==="set_advice"?typeof s.advice=="string":s.type==="start"||s.type==="advance"||s.type==="replay"||s.type==="new_season"}function le(e,s=()=>{}){const t={game:"agentling-last-vote",version:"1.0",getState:()=>C(e.getState()),getActions:()=>C(e.getActions()),dispatch:n=>{const a=e.isTerminal(),i=de(n)?C(n):null,r=i?e.dispatch(i):!1;return s("agent:step",{game:t.game,action:i,changed:r,terminal:e.isTerminal(),score:e.getScore(),wasTerminal:a}),r},reset:n=>e.reset(n),isTerminal:()=>e.isTerminal(),getScore:()=>e.getScore(),captureFrame:()=>null,observe:()=>({game:t.game,state:t.getState(),actions:t.getActions(),terminal:t.isTerminal(),score:t.getScore()})};return t}function ue(e){const s=(n,a)=>window.dispatchEvent(new CustomEvent(n,{detail:a})),t=le(e,s);return window.Agent=t,document.documentElement.dataset.agentApi=`${t.game}@${t.version}`,s("agent:ready",{game:t.game,version:t.version}),t}let q=null,pe=1;function fe(){return q||(q=new Worker(new URL(""+new URL("local-whisper-worker-MFHJRqz8.js",import.meta.url).href,import.meta.url),{type:"module"})),q}function me(e,s=()=>{}){const t=pe++,n=fe();return new Promise((a,i)=>{const r=d=>{if(d.data.id===t){if(d.data.type==="progress"){s(d.data.message,d.data.percent);return}n.removeEventListener("message",r),d.data.type==="error"?i(new Error(d.data.message)):a({kind:d.data.kind,score:d.data.score,margin:d.data.margin})}};n.addEventListener("message",r);const c={type:"interpret",id:t,advice:e};n.postMessage(c)})}function ge(e){const s=new Map;for(const t of e.votes)s.set(t.targetId,(s.get(t.targetId)??0)+1);return e.cast.map(t=>({agentId:t.id,count:s.get(t.id)??0})).sort((t,n)=>n.count-t.count||t.agentId.localeCompare(n.agentId))}function W(e){const s=e.cast.find(r=>r.id===e.playerId),t=e.cast.find(r=>r.id===e.exiledId),n=e.scenes.flatMap(r=>r.intents).filter(r=>r.actorId===e.playerId&&r.adviceInfluenced),a={cooperate:"협력으로",share:"나눔으로",hoard:"독점으로",accuse:"의심으로",defend:"변호로",abstain:"회피로"},i=n[0]?a[n[0].action]:"자기 방식";return e.playerSurvived?`“${e.advice}” — ${s.name}의 선택은 ${i} 드러났고, 마지막 표는 ${t.name}에게 향했다.`:`“${e.advice}” — ${s.name}의 선택은 ${i} 드러났고, 그 원칙은 결국 자신을 저택 밖으로 밀어냈다.`}const m=F,O=G,j=document.querySelector("#app");if(!j)throw new Error("Missing #app root");const R=j,H="last-vote-browser-001",$=["보물보다 동료를 먼저 구해.","사람을 너무 쉽게 믿지 마.","불리하면 무조건 도망가."],x={arin:"#ffb84d",bora:"#68d9c8",chul:"#f07167",dana:"#9b8cff",eun:"#8bd450",finn:"#69a7ff"},ve={cooperate:"협력",share:"나눔",hoard:"독점",accuse:"의심",defend:"변호",abstain:"회피"},ye={cooperate:"↗",share:"◇",hoard:"■",accuse:"!",defend:"+",abstain:"…"};let b="arin",l=$[0],f=k(l,m),N=H,o=null,p=0,u="idle",v="첫 실행 시 약 140MB를 내려받고 브라우저에 저장합니다.",y;function I(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function g(e){const s=m.find(t=>t.id===e);if(!s)throw new Error(`Unknown agent: ${e}`);return s}function V(e,s){return`
    <div class="noise" aria-hidden="true"></div>
    <header class="topbar">
      <a class="brand" href="#" aria-label="Agentling Last Vote 처음으로">
        <span class="brand-mark">A</span>
        <span>AGENTLING</span>
      </a>
      <div class="season-label"><span class="live-dot"></span> LAST VOTE / S01</div>
      <div class="build-label">LOCAL-AI BUILD 0.2</div>
    </header>
    <main class="game-shell ${s}">${e}</main>
    <footer>
      <span>Built with Codex</span>
      <span>Seeded replay · On-device CPU · No API key</span>
    </footer>
  `}function S(){const e=m.map((r,c)=>`
        <button class="character-card ${r.id===b?"selected":""}"
          data-agent="${r.id}" style="--agent:${x[r.id]}" aria-pressed="${r.id===b}">
          <span class="character-index">0${c+1}</span>
          <span class="avatar">${r.name.slice(0,1)}</span>
          <span class="character-copy">
            <strong>${r.name}</strong>
            <small>${r.traits.join(" · ")}</small>
          </span>
          <span class="selector">${r.id===b?"✓":"+"}</span>
        </button>`).join(""),s=$.map((r,c)=>`
        <button class="advice-card ${r===l?"selected":""}" data-advice="${I(r)}">
          <span>0${c+1}</span>
          <strong>“${I(r)}”</strong>
        </button>`).join(""),t=!$.includes(l),n=f.targetId?g(f.targetId).name:null,a=f.kind==="neutral"&&u==="idle"?"규칙으로 해석되지 않음":`${D[f.kind]}${n?` · ${n}`:""}`,i=u==="loading"?"내 기기에서 해석 중":u==="ready"?"다시 해석":"내 기기에서 의미 해석";R.innerHTML=V(`
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
            <textarea id="custom-advice" maxlength="80" rows="2" placeholder="예: 철을 믿지 마. / 다나가 위험하면 대신 희생해.">${t?I(l):""}</textarea>
          </label>
          <div class="local-whisper-lab ${u}">
            <div class="local-whisper-copy">
              <span>LOCAL WHISPER · CPU</span>
              <strong id="local-policy-summary">${I(a)}</strong>
              <small id="local-whisper-status">${I(v)}</small>
              <i id="local-whisper-progress" style="--progress:${y??0}%"></i>
            </div>
            <button id="interpret-local" type="button" ${!t||u==="loading"?"disabled":""}>${i}</button>
          </div>
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
      </section>`,"setup-mode"),document.querySelectorAll("[data-agent]").forEach(r=>{r.addEventListener("click",()=>{w({type:"select_agent",agentId:r.dataset.agent})})}),document.querySelectorAll("[data-advice]").forEach(r=>{r.addEventListener("click",()=>{w({type:"set_advice",advice:r.dataset.advice})})}),document.querySelector("#custom-advice")?.addEventListener("input",r=>{const c=r.currentTarget.value.trim().slice(0,80);l=c||$[0],f=k(l,m),u="idle",v=c?"로컬 모델로 문장의 의미와 지목 대상을 해석할 수 있습니다.":"custom whisper를 입력하면 로컬 해석을 사용할 수 있습니다.",y=void 0,T(!!c)}),document.querySelector("#interpret-local")?.addEventListener("click",()=>{he()}),document.querySelector("#start-season")?.addEventListener("click",()=>{w({type:"start"})})}function T(e=!$.includes(l)){const s=document.querySelector("#local-whisper-status"),t=document.querySelector("#local-whisper-progress"),n=document.querySelector("#interpret-local"),a=document.querySelector(".local-whisper-lab");s&&(s.textContent=v),t&&t.style.setProperty("--progress",`${y??0}%`),n&&(n.disabled=!e||u==="loading",n.textContent=u==="loading"?"내 기기에서 해석 중":"내 기기에서 의미 해석"),a&&(a.className=`local-whisper-lab ${u}`)}async function he(){if($.includes(l)||u==="loading")return;const e=l;u="loading",v="CPU 모델을 준비하고 있습니다.",y=0,T(!0);try{const s=await me(e,(n,a)=>{l===e&&(v=n,y=a,T(!0))});if(l!==e)return;const t=s.margin>=.012?s.kind:"neutral";f={version:"0.1",kind:t,targetId:U(e,m),source:"local-semantic",confidence:Math.max(0,Math.min(1,s.margin/.06))},u="ready",y=100,v=t==="neutral"?"의미가 모호해 캐릭터의 원래 성격에 맡깁니다.":`이 해석은 게임 규칙으로 검증된 뒤 적용됩니다. 신뢰도 ${Math.round(f.confidence*100)}%`,S()}catch(s){if(l!==e)return;f=k(e,m),u="error",y=void 0,v=s instanceof Error?`로컬 모델 실패 · 기본 규칙으로 진행합니다. (${s.message})`:"로컬 모델 실패 · 기본 규칙으로 진행합니다.",T(!0)}}function Ie(){o=ce({seed:N,playerId:b,advice:l,advicePolicy:f,cast:m,scenes:O}),p=0,_()}function P(){return o?p>=o.scenes.length?"ending":"scene":"setup"}function $e(){const e=P();return{phase:e,seed:N,playerId:b,advice:l,advicePolicy:f,sceneIndex:e==="scene"?p:null,sceneCount:O.length,revealedScenes:o?o.scenes.slice(0,Math.min(p+1,o.scenes.length)):[],result:e==="ending"?o:null}}function be(){const e=P();return e==="setup"?[...m.map(s=>({type:"select_agent",agentId:s.id})),...$.map(s=>({type:"set_advice",advice:s})),{type:"start"}]:e==="scene"?[{type:"advance"}]:[{type:"replay"},{type:"new_season"}]}function w(e){const s=P();if(s==="setup"&&e.type==="select_agent"&&m.some(t=>t.id===e.agentId))return b===e.agentId?!1:(b=e.agentId,S(),!0);if(s==="setup"&&e.type==="set_advice"){const t=e.advice.trim().slice(0,80);return!t||t===l?!1:(l=t,f=k(t,m),u="idle",v="첫 실행 시 약 140MB를 내려받고 브라우저에 저장합니다.",y=void 0,S(),!0)}return s==="setup"&&e.type==="start"?(Ie(),!0):s==="scene"&&e.type==="advance"?(p+=1,_(),!0):s==="ending"&&e.type==="replay"?(p=0,_(),!0):s==="ending"&&e.type==="new_season"?(o=null,p=0,S(),!0):!1}function Se(e){N=e===void 0?H:String(e),b="arin",l=$[0],f=k(l,m),u="idle",v="첫 실행 시 약 140MB를 내려받고 브라우저에 저장합니다.",y=void 0,o=null,p=0,S()}function we(){return O.map((e,s)=>`<span class="progress-node ${s<=p?"active":""}">
        <i></i><small>0${s+1}</small>
      </span>`).join("")}function _(){if(!o)return S();if(p>=o.scenes.length)return Ae();const e=o.scenes[p],s=g(o.playerId),t=e.intents.map(a=>{const i=g(a.actorId),r=a.targetId?g(a.targetId):null;return`
        <article class="intent-card ${a.actorId===o.playerId?"player-intent":""}" style="--agent:${x[i.id]}">
          <div class="intent-avatar">${i.name.slice(0,1)}</div>
          <div class="intent-copy">
            <div class="intent-meta"><strong>${i.name}</strong><span>${ve[a.action]} ${ye[a.action]}</span></div>
            <p>“${I(a.speech)}”</p>
            ${r?`<small>대상 · ${r.name}</small>`:"<small>대상 · 없음</small>"}
          </div>
          ${a.adviceInfluenced?'<div class="whisper-badge">YOUR WHISPER</div>':""}
        </article>`}).join(""),n=e.deltas.slice(0,7).map(a=>{const i=g(a.fromId),r=g(a.toId),c=a.after-a.before,d=a.field==="trust"?"신뢰":a.field==="affinity"?"호감":"두려움";return`<li><span>${i.name} → ${r.name}</span><strong class="${c>=0?"positive":"negative"}">${d} ${c>0?"+":""}${c}</strong></li>`}).join("");R.innerHTML=V(`
      <section class="scene-layout">
        <div class="scene-header">
          <div><span class="eyebrow">SCENE 0${p+1} / 04</span><h1>${e.title}</h1></div>
          <blockquote><span>${s.name}에게 남긴 원칙</span>“${I(o.advice)}”</blockquote>
        </div>
        <div class="progress-track">${we()}</div>
        <div class="scene-columns">
          <div class="intent-feed"><div class="column-label">LIVE FEED <span>행동은 동시에 결정되었습니다.</span></div>${t}</div>
          <aside class="evidence-panel">
            <div class="column-label">RULE EVIDENCE <span>대사가 아닌 코드가 바꾼 값</span></div>
            <ul>${n||"<li>관계 변화 없음</li>"}</ul>
            <div class="evidence-note"><strong>왜 이렇게 됐나요?</strong><p>각 행동은 고정된 관계 규칙으로 해결됩니다. 생성된 표현은 점수나 승패를 바꿀 수 없습니다.</p></div>
            <button id="next-scene" class="primary-action">${p===o.scenes.length-1?"마지막 투표":"다음 장면"} <span>→</span></button>
          </aside>
        </div>
      </section>`,"scene-mode"),document.querySelector("#next-scene")?.addEventListener("click",()=>{w({type:"advance"})})}function Ae(){if(!o)return S();const e=g(o.playerId),s=g(o.exiledId),t=ge(o),n=Math.max(...t.map(i=>i.count),1),a=t.map(i=>{const r=g(i.agentId);return`<li class="${i.agentId===o.exiledId?"exiled":""}">
        <span class="vote-avatar" style="--agent:${x[r.id]}">${r.name.slice(0,1)}</span>
        <strong>${r.name}</strong>
        <div class="vote-bar"><i style="width:${i.count/n*100}%"></i></div>
        <b>${i.count}표</b>
      </li>`}).join("");R.innerHTML=V(`
      <section class="ending-layout ${o.playerSurvived?"survived":"eliminated"}">
        <div class="ending-copy">
          <span class="eyebrow">FINAL RESULT / REPLAY ${o.seed.toUpperCase()}</span>
          <p class="verdict">${o.playerSurvived?"SURVIVED":"EXILED"}</p>
          <h1>${s.name},<br><em>저택을 떠나다.</em></h1>
          <p class="story">${I(W(o))}</p>
          <div class="ending-actions">
            <button id="share-story" class="primary-action">결말 문장 복사 <span>↗</span></button>
            <button id="replay-season" class="secondary-action">같은 시즌 다시 보기</button>
            <button id="new-season" class="text-action">다른 원칙 남기기</button>
          </div>
        </div>
        <aside class="vote-panel">
          <div class="vote-stamp"><span>LAST</span><strong>VOTE</strong></div>
          <div class="owned-agent"><span>내 캐릭터</span><strong style="--agent:${x[e.id]}">${e.name}</strong><b>${o.playerSurvived?"생존":"추방"}</b></div>
          <div class="column-label">VOTE TALLY <span>동률은 ID 순으로 결정</span></div>
          <ol>${a}</ol>
        </aside>
      </section>`,"ending-mode"),document.querySelector("#replay-season")?.addEventListener("click",()=>{w({type:"replay"})}),document.querySelector("#new-season")?.addEventListener("click",()=>{w({type:"new_season"})}),document.querySelector("#share-story")?.addEventListener("click",async i=>{const r=i.currentTarget;try{await navigator.clipboard.writeText(W(o)),r.innerHTML="복사 완료 <span>↗</span>"}catch{r.innerHTML="복사할 수 없음 <span>↗</span>"}})}S();ue({getState:$e,getActions:be,dispatch:w,reset:Se,isTerminal:()=>P()==="ending",getScore:()=>P()==="ending"&&o?.playerSurvived?1:0});
