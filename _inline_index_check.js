// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — MAIN GAME (mobile-first)
//  Uses core.js + mapData.js + ui.js + mobile.js + saveload.js
// ═══════════════════════════════════════════════════════════════════════════
const W=400,H=300,TS=20,COLS=20,ROWS=15,PS=14;

const Settings={
  open(){document.getElementById('settingsOv').classList.add('show');this.sync()},
  close(){document.getElementById('settingsOv').classList.remove('show')},
  sync(){
    Save.load();
    const snd=document.getElementById('setSnd');
    const mus=document.getElementById('setMus');
    const mob=document.getElementById('setMobUI');
    const theme=document.getElementById('setTheme');
    if(snd)snd.classList.toggle('on',Save.g('soundEnabled')!==false);
    if(mus)mus.classList.toggle('on',Save.g('musicEnabled')!==false);
    if(mob)mob.classList.toggle('on',Save.g('mobileUI')!==false);
    if(theme)theme.value=Save.g('theme')||'green';
  },
  init(){
    document.getElementById('setClose')?.addEventListener('click',()=>this.close());
    document.getElementById('setSnd')?.addEventListener('click',function(){
      this.classList.toggle('on');Save.s('soundEnabled',this.classList.contains('on'))});
    document.getElementById('setMus')?.addEventListener('click',function(){
      this.classList.toggle('on');Save.s('musicEnabled',this.classList.contains('on'))});
    document.getElementById('setMobUI')?.addEventListener('click',function(){
      this.classList.toggle('on');const on=this.classList.contains('on');
      Save.s('mobileUI',on);if(typeof Mobile!=='undefined')Mobile.toggle(on)});
    document.getElementById('setTheme')?.addEventListener('change',function(){
      Save.s('theme',this.value);Settings.applyTheme(this.value)});
    document.getElementById('setGuideBtn')?.addEventListener('click',()=>{Settings.close();GuideUI.open()});
    document.getElementById('setReset')?.addEventListener('click',()=>{
      if(confirm('정말 모든 데이터를 초기화하시겠습니까?')){Save.resetAll();location.reload()}});
    document.getElementById('btnPauseSet')?.addEventListener('click',()=>{
      if(typeof G!=='undefined'){G.resume()}Settings.open()});
    document.getElementById('ttGear')?.addEventListener('click',e=>{e.stopPropagation();Settings.open()});
    this.applyTheme(Save.g('theme')||'green');
  },
  applyTheme(t){
    const themes={
      green:{p:'#4a8',bg:'#080a08'},
      dark:{p:'#888',bg:'#0a0a0a'},
      ocean:{p:'#48a',bg:'#060a10'},
      sunset:{p:'#a64',bg:'#100808'},
    };
    const th=themes[t]||themes.green;
    document.documentElement.style.setProperty('--p',th.p);
    document.body.style.background=th.bg;
  }
};

const GuideUI={
  open(){document.getElementById('guideOv').classList.add('show')},
  close(){document.getElementById('guideOv').classList.remove('show');Save.s('guideSeen',true)},
  init(){
    document.getElementById('guideCloseBtn')?.addEventListener('click',()=>this.close());
    document.getElementById('guideClose')?.addEventListener('click',()=>this.close());
    document.getElementById('btnMenuGuide')?.addEventListener('click',()=>this.open());
    Save.load();
    if(!Save.g('guideSeen')){setTimeout(()=>this.open(),300)}
  }
};

const SlotUI={
  mode:'save',
  openSave(){this.mode='save';this.render();document.getElementById('slotOverlay').classList.add('show')},
  openLoad(){this.mode='load';this.render();document.getElementById('slotOverlay').classList.add('show')},
  close(){document.getElementById('slotOverlay').classList.remove('show')},
  render(){
    document.getElementById('slotTitle').textContent=this.mode==='save'?'💾 저장하기':'📂 불러오기';
    const list=document.getElementById('slotList');
    const slots=SaveSlots.getSlotInfo();
    list.innerHTML=slots.map(s=>{
      if(s.empty){
        return`<div class="slot-card empty" data-idx="${s.index}">
          <div class="slot-icon">📄</div>
          <div class="slot-info"><div class="slot-name">${s.name}</div><div class="slot-meta">비어있음</div></div>
          ${this.mode==='save'?'<div class="slot-actions"><button class="slot-btn" data-act="save" data-idx="'+s.index+'">저장</button></div>':''}
        </div>`;
      }
      const mapName=(MapData[s.map]||{}).name||s.map;
      return`<div class="slot-card" data-idx="${s.index}">
        <div class="slot-icon">${s.chapter>0?'🎮':'📄'}</div>
        <div class="slot-info">
          <div class="slot-name">${s.name}</div>
          <div class="slot-meta">Lv.${s.level} · Ch.${s.chapter} · ${mapName} · 🪙${s.coins} · 처치${s.kills} · 정화${s.purity}%</div>
          <div class="slot-date">${s.date} · ${SaveSlots.formatTime(s.playtime)}</div>
        </div>
        <div class="slot-actions">
          ${this.mode==='save'?'<button class="slot-btn" data-act="save" data-idx="'+s.index+'">덮어쓰기</button>':''}
          ${this.mode==='load'?'<button class="slot-btn" data-act="load" data-idx="'+s.index+'">불러오기</button>':''}
          <button class="slot-btn del" data-act="del" data-idx="${s.index}">🗑</button>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('.slot-btn').forEach(btn=>{
      btn.addEventListener('click',e=>{
        e.stopPropagation();
        const idx=parseInt(btn.dataset.idx);
        const act=btn.dataset.act;
        if(act==='save'){
          const name=prompt('슬롯 이름 (비워두면 자동):','');
          if(SaveSlots.saveToSlot(idx,name||null)){
            this.render();
            try{playBeep(600,.1)}catch(e){}
          }else{alert('저장 실패!')}
        }else if(act==='load'){
          if(confirm('이 슬롯을 불러오시겠습니까? 현재 진행은 저장되지 않습니다.')){
            if(SaveSlots.loadFromSlot(idx)){this.close();
              if(typeof G!=='undefined')G.startGame();
            }else{alert('불러오기 실패!')}
          }
        }else if(act==='del'){
          if(confirm('이 슬롯을 삭제하시겠습니까?')){
            SaveSlots.deleteSlot(idx);this.render();
          }
        }
      });
    });
  },
  init(){
    document.getElementById('slotClose')?.addEventListener('click',()=>this.close());
    document.getElementById('ttSave')?.addEventListener('click',e=>{e.stopPropagation();this.openSave()});
    document.getElementById('ttLoad')?.addEventListener('click',e=>{e.stopPropagation();this.openLoad()});
  }
};

const MapView={
  currentIdx:0,
  open(){
    Save.load();
    this.syncUnlocks();
    const mapIds=Object.keys(MapData);
    const curMap=Save.g('currentMap')||'map1';
    this.currentIdx=mapIds.indexOf(curMap);if(this.currentIdx<0)this.currentIdx=0;
    document.getElementById('mapViewOv').classList.add('show');
    this.render();
  },
  close(){document.getElementById('mapViewOv').classList.remove('show')},
  syncUnlocks(){
    Save.load();
    const mapIds=Object.keys(MapData);
    let unlocked=Math.max(1, Number(Save.g('unlockedLevels')||1));
    const cur=Save.g('currentMap')||'map1';
    const curIdx=mapIds.indexOf(cur);
    if(curIdx>=0)unlocked=Math.max(unlocked, curIdx+1);
    Save.d.unlockedLevels=Math.min(mapIds.length, unlocked);
    Save.save();
    return Save.d.unlockedLevels;
  },
  isUnlocked(idx){return idx < this.syncUnlocks()},
  selectCurrent(){
    const mapIds=Object.keys(MapData);
    const mapId=mapIds[this.currentIdx];
    if(!mapId||!this.isUnlocked(this.currentIdx))return;
    Save.s('currentMap',mapId);
    const md=MapData[mapId];
    if(md)Save.s('chapter',Math.max(Save.g('chapter')||1, md.chapter||1));
    this.close();
    if(typeof G!=='undefined')G.startGame();
  },
  render(){
    const mapIds=Object.keys(MapData);
    const unlocked=this.syncUnlocks();
    const md=MapData[mapIds[this.currentIdx]];
    if(!md)return;
    document.getElementById('mvMapName').textContent=md.name;
    document.getElementById('mvInfo').textContent=`Ch.${md.chapter} ${md.name} — ${md.subtitle||''}`;
    document.getElementById('mvPrev').disabled=this.currentIdx<=0;
    document.getElementById('mvNext').disabled=this.currentIdx>=mapIds.length-1||this.currentIdx+1>=unlocked;
    const startBtn=document.getElementById('mvStart');
    if(startBtn){
      startBtn.disabled=this.currentIdx>=unlocked;
      startBtn.textContent=this.currentIdx<unlocked?'▶ 이 스테이지 시작':'🔒 미해금';
    }
    const cv2=document.getElementById('mvCanvas');
    const c2=cv2.getContext('2d');c2.imageSmoothingEnabled=false;
    const isUnlocked=this.currentIdx<unlocked;
    const isCurrent=mapIds[this.currentIdx]===(Save.g('currentMap')||'map1');
    if(isUnlocked){
      const gen=generateMap(md.id);
      const tiles=gen.tiles;const pal=md.palette;
      c2.fillStyle='#0a0a0a';c2.fillRect(0,0,400,300);
      for(let r=0;r<md.rows;r++)for(let c=0;c<md.cols;c++){
        const t=tiles[r][c],x=c*20,y=r*20;
        const h=((x/20*7+y/20*13)|0)%8;
        switch(t){
          case T.POL:c2.fillStyle=pal.pol;c2.fillRect(x,y,20,20);break;
          case T.CLN:c2.fillStyle=pal.cln;c2.fillRect(x,y,20,20);break;
          case T.GRS:c2.fillStyle=pal.grs;c2.fillRect(x,y,20,20);
            c2.fillStyle='#5ab04a';for(let i=0;i<3;i++)c2.fillRect(x+4+i*6,y+14,1,4);break;
          case T.T1:case T.T2:case T.T3:c2.fillStyle=pal.grs;c2.fillRect(x,y,20,20);
            c2.fillStyle='#6b4226';c2.fillRect(x+9,y+8,2,10);
            c2.fillStyle=pal['t'+(t-T.T1+1)];c2.fillRect(x+4,y+2,12,9);break;
          case T.FLR:c2.fillStyle=pal.grs;c2.fillRect(x,y,20,20);
            c2.fillStyle=h%2?pal.f1:pal.f2;c2.fillRect(x+8,y+8,3,3);break;
          case T.TRS:c2.fillStyle=pal.pol;c2.fillRect(x,y,20,20);
            c2.fillStyle='#666';c2.fillRect(x+4,y+10,5,6);break;
          case T.WAT:c2.fillStyle='#2a4a6a';c2.fillRect(x,y,20,20);
            c2.fillStyle='rgba(100,180,255,.2)';c2.fillRect(x+2,y+2,16,16);break;
          case T.ROK:c2.fillStyle='#555';c2.fillRect(x,y,20,20);break;
          case T.SND:c2.fillStyle='#c0a060';c2.fillRect(x,y,20,20);break;
          case T.LAV:c2.fillStyle='#8a2a0a';c2.fillRect(x,y,20,20);
            c2.fillStyle='#e04010';c2.fillRect(x+3,y+3,14,14);break;
          case T.ICE:c2.fillStyle='#a0c0e0';c2.fillRect(x,y,20,20);break;
          default:c2.fillStyle='#222';c2.fillRect(x,y,20,20);
        }
      }
      if(md.ruins)md.ruins.forEach(r=>{
        c2.fillStyle='rgba(200,150,80,.18)';c2.fillRect(r.col*20,r.row*20,r.w*20,r.h*20);
        c2.fillStyle='rgba(200,150,80,.5)';c2.font='8px monospace';c2.fillText(r.icon,r.col*20+4,r.row*20+12)});
      const[sc,sr]=md.startPos;
      c2.fillStyle='rgba(80,200,80,.4)';c2.beginPath();c2.arc(sc*20+10,sr*20+10,8,0,Math.PI*2);c2.fill();
      c2.fillStyle='#5c5';c2.beginPath();c2.arc(sc*20+10,sr*20+10,4,0,Math.PI*2);c2.fill();
      if(md.portalPos){const[pc,pr]=md.portalPos;
        c2.fillStyle='rgba(130,170,255,.3)';c2.beginPath();c2.arc(pc*20+10,pr*20+10,7,0,Math.PI*2);c2.fill();
        c2.fillStyle='rgba(200,220,255,.5)';c2.beginPath();c2.arc(pc*20+10,pr*20+10,3,0,Math.PI*2);c2.fill()}
      if(isCurrent&&typeof G!=='undefined'&&G.state==='playing'){
        c2.fillStyle='#ff0';c2.beginPath();c2.arc(G.plx,G.ply,5,0,Math.PI*2);c2.fill();
        c2.strokeStyle='rgba(255,255,0,.4)';c2.lineWidth=2;c2.beginPath();c2.arc(G.plx,G.ply,9,0,Math.PI*2);c2.stroke()}
      c2.strokeStyle='rgba(100,200,100,.08)';c2.lineWidth=1;c2.setLineDash([3,3]);
      c2.strokeRect(0,0,200,150);c2.strokeRect(200,0,200,150);c2.strokeRect(0,150,200,150);c2.strokeRect(200,150,200,150);
      c2.setLineDash([]);
      if(md.palette.ambient){c2.fillStyle=md.palette.ambient;c2.fillRect(0,0,400,300)}
    }else{
      c2.fillStyle='#111';c2.fillRect(0,0,400,300);
      c2.fillStyle='rgba(255,255,255,.05)';
      c2.font='24px monospace';c2.fillText('🔒',180,145);
      c2.font='10px monospace';c2.fillStyle='rgba(255,255,255,.15)';
      c2.fillText('미탐험 구역',165,175);
      c2.fillText(md.name,175,190);
    }
  },
  init(){
    document.getElementById('mvClose')?.addEventListener('click',()=>this.close());
    document.getElementById('mvPrev')?.addEventListener('click',()=>{if(this.currentIdx>0){this.currentIdx--;this.render()}});
    document.getElementById('mvNext')?.addEventListener('click',()=>{
      const unlocked=this.syncUnlocks();
      if(this.currentIdx<Object.keys(MapData).length-1&&this.currentIdx+1<unlocked){this.currentIdx++;this.render()}});
    document.getElementById('mvStart')?.addEventListener('click',()=>this.selectCurrent());
    document.getElementById('ttMap')?.addEventListener('click',e=>{e.stopPropagation();this.open()});
  }
};

function initTopTools(){
  SlotUI.init();
  MapView.init();
}

const cv=document.getElementById('C'),cx=cv.getContext('2d');
cx.imageSmoothingEnabled=false;

const TRASH=Object.values(TrashTypes);
let PAL={pol:'#3a3020',cln:'#6b5a3a',grs:'#3a6a2a',w:'#2a5a7a',t1:'#4a8a3a',t2:'#2a7a1a',t3:'#1a6a0a',f1:'#e68',f2:'#fd3'};

function px(x,y,w,h,c){cx.fillStyle=c;cx.fillRect(Math.floor(x),Math.floor(y),w,h)}
function dot(x,y,c){cx.fillStyle=c;cx.fillRect(Math.floor(x),Math.floor(y),1,1)}
function drawTile(x,y,t,f){Draw.tile(cx,x,y,t,PAL,f)}

let devOpen=false;
function toggleDev(){
  devOpen=!devOpen;
  document.getElementById('devPanel').classList.toggle('show',devOpen);
  if(devOpen)renderDev();
}
function renderDev(){
  Save.load();
  const d=Save.d;
  const md=getCurrentMapData();
  const st=G.mapStats?G.mapStats():{pct:0,pol:0,tr:0,trees:0,tot:1};
  const inv=Inventory.getAll();
  const html=`
    <div class="dv-section"><h2>📊 플레이어 상태</h2>
      ${[['레벨',d.level],['XP',d.xp+'/'+d.xpNext],['HP',Math.floor(G.plHP)+'/'+G.plMaxHP],
        ['에너지',Math.floor(G.plEnergy)+'/'+G.plMaxEn],['물',Math.floor(G.plWater)],['종자',Math.floor(G.plSeeds)],
        ['코인',d.coins],['보석',d.gems||0],['총 처치',d.totalKills],['콤보',G.combo]
      ].map(([k,v])=>`<div class="dv-row"><span class="dv-k">${k}</span><span class="dv-v">${v}</span></div>`).join('')}
    </div>
    <div class="dv-section"><h2>🗺️ 맵 상태</h2>
      ${[['현재 맵',md.name+' ('+md.id+')'],['챕터',d.chapter],['정화율',Math.floor(st.pct*100)+'%'],
        ['오염 타일',st.pol],['쓰레기 더미',st.tr],['나무',st.trees],['몬스터 수',G.monsters?.length||0],
        ['보스 처치',JSON.stringify(d.bossesDefeated||[])],['포탈',G.portal?'활성':'비활성']
      ].map(([k,v])=>`<div class="dv-row"><span class="dv-k">${k}</span><span class="dv-v">${v}</span></div>`).join('')}
    </div>
    <div class="dv-section"><h2>📦 인벤토리 (${inv.length}종)</h2>
      ${inv.length?inv.map(i=>`<div class="dv-row"><span class="dv-k">${i.icon||'?'} ${i.name}</span><span class="dv-v">×${i.qty}</span></div>`).join(''):'<div class="dv-row"><span class="dv-k">비어있음</span></div>'}
    </div>
    <div class="dv-section"><h2>⚔️ 장비</h2>
      ${[['무기',d.equippedWeapon||'없음'],['도구',d.equippedTool||'broom'],['펫',d.equippedPet||'없음'],['오라',d.equippedAura||'없음']
      ].map(([k,v])=>`<div class="dv-row"><span class="dv-k">${k}</span><span class="dv-v">${v}</span></div>`).join('')}
    </div>
    <div class="dv-section"><h2>🎯 활성 퀘스트</h2>
      ${(d.activeQuests||[]).map(qid=>{const q=Quests.db[qid];const p=d.questProgress[qid]||{current:0};
        return q?`<div class="dv-row"><span class="dv-k">${q.icon} ${q.title}</span><span class="dv-v">${p.current}/${q.target}</span></div>`:''}).join('')||'<div class="dv-row"><span class="dv-k">없음</span></div>'}
    </div>
    <div class="dv-section"><h2>👹 발견 몬스터</h2>
      ${(d.discoveredMonsters||[]).map(m=>{const md2=MonsterDB[m]||ExtMonsters?.[m];
        return md2?`<div class="dv-row"><span class="dv-k">${md2.icon} ${md2.name}</span><span class="dv-v">HP${md2.hp}</span></div>`:''}).join('')||'<div class="dv-row"><span class="dv-k">없음</span></div>'}
    </div>
    <div class="dv-section"><h2>🏆 트로피 (${(d.trophies||[]).length}/${Object.keys(TrophyDB).length})</h2>
      ${(d.trophies||[]).map(tid=>{const tr=TrophyDB[tid];return tr?`<div class="dv-row"><span class="dv-k">${tr.icon} ${tr.name}</span><span class="dv-v">✓</span></div>`:''}).join('')||'<div class="dv-row"><span class="dv-k">없음</span></div>'}
    </div>
    <div class="dv-section"><h2>📖 수집 서적 (${(d.booksCollected||[]).length}/5)</h2>
      ${BookIDs.map(bid=>{const has=(d.booksCollected||[]).includes(bid);const item=ItemDB[bid];
        return`<div class="dv-row"><span class="dv-k">${item?.icon||'?'} ${item?.name||bid}</span><span class="dv-v">${has?'✓':'✗'}</span></div>`}).join('')}
    </div>
    <div class="dv-section"><h2>🔧 치트 명령</h2>
      <button class="dv-btn" onclick="Save.addCoins(500);renderDev()">+500 코인</button>
      <button class="dv-btn" onclick="G.plHP=G.plMaxHP;renderDev()">HP 회복</button>
      <button class="dv-btn" onclick="G.plEnergy=G.plMaxEn;renderDev()">에너지 회복</button>
      <button class="dv-btn" onclick="Inventory.add('potion_hp',5);renderDev()">+5 체력물약</button>
      <button class="dv-btn" onclick="Inventory.add('pure_crystal',3);renderDev()">+3 정화수정</button>
      <button class="dv-btn" onclick="Save.s('currentMap','map2');G.startGame()">→ 맵2 이동</button>
      <button class="dv-btn" onclick="Save.s('currentMap','map3');G.startGame()">→ 맵3 이동</button>
      <button class="dv-btn" onclick="Save.s('currentMap','map4');G.startGame()">→ 맵4 이동</button>
      <button class="dv-btn" onclick="for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(G.tiles[r][c]===T.POL)G.tiles[r][c]=T.CLN;renderDev()">전체 정화</button>
      <button class="dv-btn" onclick="Save.resetAll();location.reload()">⚠ 세이브 초기화</button>
    </div>
    <div class="dv-section"><h2>🔑 스토리 플래그</h2>
      ${Object.entries(d.storyFlags||{}).map(([k,v])=>`<div class="dv-row"><span class="dv-k">${k}</span><span class="dv-v">${v}</span></div>`).join('')||'<div class="dv-row"><span class="dv-k">없음</span></div>'}</div>`;
  document.getElementById('devContent').innerHTML=html;
}
document.getElementById('devClose').addEventListener('click',toggleDev);

function drawPlayer(x,y,dir,frm,inv,cols,atkAnim){
  if(inv>0&&Math.floor(inv/3)%2)return;
  const p=Math.floor(x-7),q=Math.floor(y-10),wk=Math.floor(frm)%2,c=cols||['#4a8a3a','#3a7a2a','#daa060'];
  cx.fillStyle='rgba(0,0,0,.2)';cx.fillRect(p+2,q+14,10,3);
  px(p+3,q+12,3,2,'#4a3a1a');px(p+8,q+12,3,2,'#4a3a1a');
  if(wk){px(p+2,q+12,3,2,'#4a3a1a');px(p+9,q+12,3,2,'#4a3a1a')}
  px(p+4,q+10,2,3,c[1]);px(p+8,q+10,2,3,c[1]);px(p+3,q+5,8,6,c[0]);px(p+5,q+5,4,5,c[1]);
  const ay=wk?q+6:q+7;px(p+1,ay,2,4,c[2]);px(p+11,ay,2,4,c[2]);
  px(p+4,q+1,6,5,c[2]);px(p+3,q-1,8,2,c[1]);px(p+5,q-2,4,1,c[0]);
  const ex=dir===2?-1:dir===3?1:0;px(p+5+ex,q+3,1,1,'#111');px(p+8+ex,q+3,1,1,'#111');px(p+6,q+4,2,1,'#a06030')
  // ATTACK SWING VISUAL
  if(atkAnim&&atkAnim>0){
    const swingLen=Math.max(4,atkAnim*2);
    const swingColor='#ffeb3b';
    cx.strokeStyle=swingColor;cx.lineWidth=2;cx.globalAlpha=Math.min(1,atkAnim/8);
    const dirOff=[[0,12],[0,-12],[-12,0],[12,0]];
    const[ox,oy]=dirOff[dir]||[0,0];
    const sx=x+ox,sy=y+oy;
    cx.beginPath();
    if(dir===0||dir===1){cx.moveTo(sx-swingLen,sy-2);cx.lineTo(sx+swingLen,sy-2);cx.lineTo(sx+swingLen+2,sy);cx.lineTo(sx+swingLen,sy+2);cx.lineTo(sx-swingLen,sy+2);cx.lineTo(sx-swingLen,sy-2);cx.fill()}
    else{cx.moveTo(sx-2,sy-swingLen);cx.lineTo(sx-2,sy+swingLen);cx.lineTo(sx,sy+swingLen+2);cx.lineTo(sx+2,sy+swingLen);cx.lineTo(sx+2,sy-swingLen);cx.lineTo(sx-2,sy-swingLen);cx.fill()}
    cx.globalAlpha=1;
  }
}

function drawTrash(x,y,n){const p=Math.floor(x),q=Math.floor(y);switch(n){
  case'bottle':px(p-2,q-5,4,8,'#6ab4e8');px(p-1,q-8,2,1,'#eee');break;
  case'bag':px(p-4,q-3,8,6,'#ccc');break;case'tire':px(p-4,q-4,8,8,'#333');break;
  case'can':px(p-2,q-3,4,6,'#c33');break;case'barrel':px(p-3,q-4,6,8,'#a63');break;
  case'ewaste':px(p-4,q-3,8,6,'#222');px(p-3,q-2,6,4,'#3a3');break;}}

function drawMonster(m,f){
  Draw.monster(cx,m,f);
}

function drawBook(b,f){
  Draw.book(cx,b,f);
}

function drawPortal(x,y,f){
  const pulse=Math.sin(f*.08)*3;
  cx.globalAlpha=.3+Math.sin(f*.04)*.15;
  cx.fillStyle='#8af';cx.beginPath();cx.arc(x+TS/2,y+TS/2,10+pulse,0,Math.PI*2);cx.fill();
  cx.fillStyle='#fff';cx.beginPath();cx.arc(x+TS/2,y+TS/2,4+pulse*.5,0,Math.PI*2);cx.fill();
  cx.globalAlpha=1;
}

function drawElderPortrait(){
  const c=document.getElementById('vnPC').getContext('2d');c.imageSmoothingEnabled=false;
  c.clearRect(0,0,64,80);
  c.fillStyle='#5a4030';c.fillRect(16,45,32,30);
  c.fillStyle='#3a5a4a';c.fillRect(14,40,36,35);c.fillStyle='#2a4a3a';c.fillRect(18,42,28,30);
  c.fillStyle='#c8a878';c.fillRect(22,15,20,22);
  c.fillStyle='#ccc';c.fillRect(24,32,16,12);c.fillRect(26,34,12,10);
  c.fillStyle='#aaa';c.fillRect(20,12,24,8);c.fillRect(18,14,4,10);c.fillRect(42,14,4,10);
  c.fillStyle='#333';c.fillRect(26,22,3,3);c.fillRect(35,22,3,3);
  c.fillStyle='#999';c.fillRect(25,20,5,1);c.fillRect(34,20,5,1);
  c.fillStyle='#6a4a2a';c.fillRect(10,20,3,55);c.fillStyle='#8f8';c.fillRect(8,16,7,6);
}

class Parts{constructor(){this.p=[]}
  emit(x,y,n,cfg){for(let i=0;i<n;i++){const l=CoreUtil.rand(cfg.la||15,cfg.lb||35);
    this.p.push({x,y,vx:CoreUtil.rand(cfg.xa||-2,cfg.xb||2),vy:CoreUtil.rand(cfg.ya||-2,cfg.yb||0),
      l,ml:l,sz:CoreUtil.rand(cfg.sa||1,cfg.sb||3),c:cfg.cs[CoreUtil.randInt(0,cfg.cs.length-1)],g:cfg.g||.04,f:cfg.f||.97})}}
  update(){for(let i=this.p.length-1;i>=0;i--){const p=this.p[i];p.vx*=p.f;p.vy*=p.f;p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;if(--p.l<=0)this.p.splice(i,1)}}
  draw(){for(const p of this.p){cx.globalAlpha=p.l/p.ml;px(p.x,p.y,Math.max(1,Math.round(p.sz*(p.l/p.ml))),Math.max(1,Math.round(p.sz*(p.l/p.ml))),p.c)}cx.globalAlpha=1}}
class FText{constructor(){this.t=[]}
  add(x,y,tx,c='#fff',scale=1){this.t.push({x,y,tx,c,l:40,scale:scale||1,vy:-.5})}
  update(){for(let i=this.t.length-1;i>=0;i--){const t=this.t[i];t.y+=t.vy;if(--t.l<=0)this.t.splice(i,1)}}
  draw(){for(const t of this.t){cx.globalAlpha=Math.min(1,t.l/12);cx.fillStyle=t.c;cx.font=`${Math.max(4,Math.floor(5*t.scale))}px monospace`;cx.fillText(t.tx,t.x-(t.tx.length*3*t.scale/2),t.y)}cx.globalAlpha=1}}

const G={
  state:'menu',
  tiles:[],gTim:[],
  plx:0,ply:0,plSpd:1.8,plHP:100,plMaxHP:100,plWater:50,plSeeds:10,
  plEnergy:100,plMaxEn:100,plInv:0,plDir:0,plFrm:0,plCD:0,plAtkCD:0,plColors:['#4a8a3a','#3a7a2a','#daa060'],
  trash:[],trTimer:0,trDodged:0,trCaught:0,trWarns:[],
  monsters:[],monsterSpawnT:0,
  books:[],bookSpawnT:0,
  animals:[],aniTimer:0,
  portal:null,
  dayT:.25,day:1,rain:false,rainT:0,rainDrops:[],
  combo:0,comboT:0,comboHi:0,
  score:0,coins:0,gameT:0,frame:0,shake:0,
  // DIRECT kill counters (superBT 100) — bulletproof in-game tracking
  kills:0, killsByType:{}, killsLastUpdate:0, /* kept for compat */
  parts:new Parts(),ftext:new FText(),
  keys:{},joy:window.Mobile?.joy||{on:false,dx:0,dy:0},targetX:null,targetY:null,
  vnActive:false,vnDialogue:null,vnIdx:0,
  trophyTimer:0,
  // Impact effects (superBT 100)
  _hitStopFrames:0, _slowMoFrames:0,
  _flashColor:'#fff', _flashAlpha:0, _flashFrames:0,
  _playerHitStop:0,
  plAttackAnim:0, plAttackDir:0,

  init(){
    Save.load();
    // Track session start for kill counting
    Save.s('_sessionStartKills', Save.g('totalKills')||0);
    Save.save();
    const sndEl=document.getElementById('sndT'),musEl=document.getElementById('musT');
    if(sndEl){sndEl.checked=Save.g('soundEnabled')!==false;sndEl.addEventListener('change',e=>Save.s('soundEnabled',e.target.checked))}
    if(musEl){musEl.checked=Save.g('musicEnabled')!==false;musEl.addEventListener('change',e=>Save.s('musicEnabled',e.target.checked))}
    if(Save.g('chapter')>0)document.getElementById('btnContinue').style.display='block';
    Settings.init();
    GuideUI.init();
    initTopTools();
    this.setupInput();
    Mobile.init(this);   // Pass game reference; Mobile.setupVisibilityHook tracks state changes
    this.startLoop();
    this._lastSeenState = 'menu';
  },
  // Methods continue...

  startNew(){
    Save.resetAll();this.startGame();
  },
  continueGame(){
    if(typeof MapView!=='undefined')MapView.open();
    else this.startGame();
  },
  getStageReward(purityPct){
    const md=(typeof getCurrentMapData==='function'?getCurrentMapData():(MapData[Save.g('currentMap')||'map1']||MapData.map1));
    const stage=Math.max(1, md?.chapter||1);
    const purity=Math.max(0, Math.min(100, Math.floor(Number(purityPct)||0)));
    const base=[0,20,35,55,80][stage]||Math.round(20+stage*18);
    const purityBonus=Math.floor(base*(purity/100)*1.4);
    const survivalBonus=Math.min(base, Math.floor((this.gameT||0)/600)*Math.max(3,stage*2));
    return Math.max(5, base+purityBonus+survivalBonus);
  },
  grantGameOverReward(purityPct){
    if(this._gameOverRewarded)return {coins:0,stage:1,purity:purityPct||0};
    const md=(typeof getCurrentMapData==='function'?getCurrentMapData():(MapData[Save.g('currentMap')||'map1']||MapData.map1));
    const coins=this.getStageReward(purityPct);
    this._gameOverRewarded=true;
    this.coins+=coins;
    typeof addCoins==='function'?addCoins(coins):Save.addCoins(coins);
    if(Save.g('coins')>=1000)Trophies.unlock('rich');
    return {coins,stage:md?.chapter||1,purity:Math.floor(purityPct||0),mapName:md?.name||'스테이지'};
  },
  startGame(){
    try{getAudioCtx()}catch(e){}
    Save.load();
    const mapId=Save.g('currentMap')||'map1';
    const md=MapData[mapId]||MapData.map1;
    this.currentMapData=md;
    const gen=generateMap(mapId);
    this.tiles=gen.tiles;this.gTim=gen.gTim;
    PAL=md.palette;
    const[sc,sr]=md.startPos;
    this.plx=sc*TS+TS/2;this.ply=sr*TS+TS/2;
    this.plSpd=Save.g('baseSpeed');this.plMaxHP=Save.g('maxHP');this.plHP=this.plMaxHP;
    this.plMaxEn=Save.g('maxEnergy');this.plEnergy=this.plMaxEn;
    this.plWater=50;this.plSeeds=10;this.plInv=0;this.plDir=0;this.plFrm=0;this.plCD=0;this.plAtkCD=0;
    this.trash=[];this.trTimer=0;this.trDodged=0;this.trCaught=0;this.trWarns=[];
    this.monsters=[];this.monsterSpawnT=0;this._lastMapId=null;
    this.books=[];this.bookSpawnT=0;
    this.animals=[];this.aniTimer=0;
    this.portal=null;
    this.dayT=.25;this.day=1;this.rain=false;this.rainT=CoreUtil.randInt(500,1500);this.rainDrops=[];
    this.combo=0;this.comboT=0;this.comboHi=0;
    this.score=0;this.coins=typeof getCoins==='function'?getCoins():(Save.g('coins')||0);this.gameT=0;this.frame=0;this.shake=0;this._gameOverRewarded=false;
    this.kills=0;this.killsByType={};this.killsLastUpdate=0;  // Reset kill counters
    this.parts=new Parts();this.ftext=new FText();
    this.targetX=null;this.targetY=null;

    this.state='playing';
    document.getElementById('menuScr').classList.add('hidden');
    document.getElementById('overScr').classList.add('hidden');
    document.getElementById('pauseScr').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('goalTracker').classList.remove('hidden');

    if(Save.g('chapter')===0){
      setTimeout(()=>this.startVN('intro'),500);
    }
    this.spawnBooks();
    // Reset map progress tracker for the new map
    if(typeof MapProgress!=='undefined'&&MapProgress){
      MapProgress.reset();
      this.kills=MapProgress.kills||0;
      this.killsByType={...(MapProgress.byType||{})};
    }
    this._lastShownKills=this.kills||0;
    this._lastShownGoalCurrent=0;
    // Trigger visibility refresh for mobile controls
    if(typeof Mobile!=='undefined')Mobile.applyVisibility();
  },

  startChapterQuests(){
    const qs=['q_clean10','q_plant5','q_catch5','q_kill_slime3','q_purity30','q_collect_book','q_kill_trash_golem','q_purity70'];
    qs.forEach(q=>{if(!Quests.isComplete(q))Quests.startQuest(q)});
  },

  startVN(dialogueId){
    this.vnActive=true;this.vnDialogue=StoryDialogues[dialogueId];this.vnIdx=0;
    this.state='vn';
    document.getElementById('vnOverlay').style.display='flex';
    drawElderPortrait();
    this.showVNLine();
    if(typeof Mobile!=='undefined')Mobile.applyVisibility();
  },
  showVNLine(){
    if(!this.vnDialogue||this.vnIdx>=this.vnDialogue.length){this.endVN();return}
    const line=this.vnDialogue[this.vnIdx];
    document.getElementById('vnSpeaker').textContent=line.speaker||'';
    document.getElementById('vnText').textContent=line.text;
    const portrait=document.getElementById('vnPortrait');
    if(portrait)portrait.style.display=line.portrait?'block':'none';
  },
  advanceVN(){
    this.vnIdx++;
    if(this.vnIdx>=this.vnDialogue.length){this.endVN();return}
    this.showVNLine();
    playBeep(600,.08);
  },
  endVN(){
    this.vnActive=false;this.vnDialogue=null;
    document.getElementById('vnOverlay').style.display='none';
    this.state='playing';
    if(Save.g('chapter')===0){
      Save.s('chapter',1);Save.s('introSeen',true);
      Inventory.add('seed_pack');
      this.startChapterQuests();
    }
    if(Save.flag('bossDefeated')&&!Save.flag('victoryDialogueSeen')){
      Save.setFlag('victoryDialogueSeen');
    }
    if(typeof Mobile!=='undefined')Mobile.applyVisibility();
  },

  openInv(){
    document.getElementById('invOverlay').classList.add('show');
    document.getElementById('invDetail').style.display='none';
    const grid=document.getElementById('invGrid');grid.innerHTML='';
    const items=Inventory.getAll();
    if(items.length===0){grid.innerHTML='<div class="empty" style="grid-column:1/-1">인벤토리가 비어있습니다.</div>';return}
    items.forEach(item=>{
      const slot=document.createElement('div');slot.className='inv-slot';
      const dbItem=ItemDB[item.id]||{};
      slot.innerHTML=`<div class="inv-icon">${item.icon||'❓'}</div><div class="inv-name">${item.name}</div><div class="inv-qty">x${item.qty}</div>`;
      slot.addEventListener('click',()=>this.showItemDetail(item.id));
      grid.appendChild(slot);
    });
  },
  closeInv(){document.getElementById('invOverlay').classList.remove('show')},
  showItemDetail(id){
    const item=ItemDB[id];if(!item)return;
    document.getElementById('invDetail').style.display='block';
    document.getElementById('idName').textContent=`${item.icon||''} ${item.name}`;
    document.getElementById('idDesc').textContent=item.desc||'';
    const acts=document.getElementById('idActions');acts.innerHTML='';
    if(item.type==='consumable'){
      const btn=document.createElement('button');btn.className='ibtn-use';btn.textContent='사용';
      btn.addEventListener('click',()=>{this.useItem(id);this.openInv()});acts.appendChild(btn);
    }
    if(item.type==='weapon'){
      const btn=document.createElement('button');btn.className='ibtn-equip';btn.textContent='장착';
      btn.addEventListener('click',()=>{Save.s('equippedWeapon',id);Save.save();this.openInv()});acts.appendChild(btn);
    }
    if(item.type==='book'){
      const btn=document.createElement('button');btn.className='ibtn-use';btn.textContent='읽기';
      btn.addEventListener('click',()=>{this.closeInv();this.readBook(id)});acts.appendChild(btn);
    }
    const dropBtn=document.createElement('button');dropBtn.className='ibtn-drop';dropBtn.textContent='버리기';
    dropBtn.addEventListener('click',()=>{Inventory.remove(id);this.openInv()});acts.appendChild(dropBtn);
  },
  useItem(id){
    const item=ItemDB[id];if(!item||!Inventory.has(id))return;
    switch(item.effect){
      case'heal':this.plHP=Math.min(this.plMaxHP,this.plHP+item.value);break;
      case'energy':this.plEnergy=Math.min(this.plMaxEn,this.plEnergy+item.value);break;
      case'water':this.plWater=Math.min(100,this.plWater+item.value);break;
      case'seeds':this.plSeeds=Math.min(30,this.plSeeds+item.value);break;
      case'shield':this.plInv=item.value;break;
    }
    Inventory.remove(id);playBeep(800,.1);
    this.ftext.add(this.plx,this.ply-10,'사용!','#8ff');
  },
  readBook(id){
    const item=ItemDB[id];if(!item)return;
    document.getElementById('bookOverlay').classList.add('show');
    document.getElementById('bookTitle').textContent=`📖 ${item.name}`;
    document.getElementById('bookDesc').textContent=item.desc;
    document.getElementById('bookLore').textContent=item.lore||'';
    Save.load();
    if(!Save.d.booksCollected.includes(id)){
      Save.d.booksCollected.push(id);Save.save();
      Quests.progress('book');
      if(Save.g('booksCollected').length>=5)Trophies.unlock('all_books');
    }
  },

  spawnBooks(){
    const available=BookIDs.filter(b=>!Save.g('booksCollected').includes(b));
    const count=Math.min(2,available.length);
    for(let i=0;i<count;i++){
      const id=available[CoreUtil.randInt(0,available.length-1)];
      const c=CoreUtil.randInt(1,COLS-2),r=CoreUtil.randInt(1,ROWS-2);
      if(this.tileAt(c,r)!==T.WAT&&this.tileAt(c,r)!==T.ROK){
        this.books.push({id,x:c*TS+TS/2,y:r*TS+TS/2});
      }
    }
  },

  spawnMonster(type){
    const m=MonsterDB[type]||ExtMonsters?.[type];if(!m)return;
    let sx,sy;
    for(let attempt=0;attempt<30;attempt++){
      sx=CoreUtil.randInt(2,COLS-3)*TS+TS/2;sy=CoreUtil.randInt(2,ROWS-3)*TS+TS/2;
      if(CoreUtil.dist(sx,sy,this.plx,this.ply)>60)break;
    }
    this.monsters.push({type,x:sx,y:sy,hp:m.hp,maxHP:m.hp,dmg:m.dmg,speed:m.speed,sz:m.size||14,
      color:m.color,color2:m.color2,isBoss:m.isBoss||false,
      vx:0,vy:0,moveT:CoreUtil.randInt(30,90),atkCD:0,aggro:false,hitFlash:0,phase:1});
    Save.load();
    if(!Save.d.discoveredMonsters.includes(type)){
      Save.d.discoveredMonsters.push(type);Save.save();
      if(!Save.flag('monsterGuideSeen')){Save.setFlag('monsterGuideSeen');
        setTimeout(()=>this.startVN('monster_guide'),300);
      }
    }
  },

  setupInput(){
    document.getElementById('btnPlay').addEventListener('click',()=>this.startNew());
    document.getElementById('btnContinue').addEventListener('click',()=>this.continueGame());
    document.getElementById('btnResume').addEventListener('click',()=>this.resume());
    document.getElementById('btnInvP').addEventListener('click',()=>{this.resume();this.openInv()});
    document.getElementById('btnQuit').addEventListener('click',()=>this.toMenu());
    document.getElementById('btnRetry').addEventListener('click',()=>this.continueGame());
    document.getElementById('btnToMenu').addEventListener('click',()=>this.toMenu());
    document.getElementById('btnTrophy').addEventListener('click',()=>{try{location.href='trophy.html'}catch(e){alert('트로피 페이지 준비 중')}});
    document.getElementById('invClose').addEventListener('click',()=>this.closeInv());
    document.getElementById('bookClose').addEventListener('click',()=>document.getElementById('bookOverlay').classList.remove('show'));
    document.getElementById('vnBox').addEventListener('click',()=>{if(this.vnActive)this.advanceVN()});

    window.addEventListener('keydown',e=>{this.keys[e.code]=true;
      if(e.code==='Backquote'||e.key==='`'||e.key==='~'){e.preventDefault();e.stopPropagation();toggleDev();return}
      if(e.code==='Escape'){
        if(devOpen){toggleDev();return}
        if(document.getElementById('slotOverlay').classList.contains('show')){SlotUI.close();return}
        if(document.getElementById('mapViewOv').classList.contains('show')){MapView.close();return}
        if(document.getElementById('settingsOv').classList.contains('show')){Settings.close();return}
        if(document.getElementById('guideOv').classList.contains('show')){GuideUI.close();return}
        return}
      if(e.code==='KeyP'&&this.state==='playing')this.pause();
      else if(e.code==='KeyP'&&this.state==='paused')this.resume();
      if(e.code==='KeyI'&&(this.state==='playing'||this.state==='paused')){
        const inv=document.getElementById('invOverlay');
        inv.classList.contains('show')?this.closeInv():this.openInv();}
      if(e.code==='KeyM'&&(this.state==='playing'||this.state==='paused')){
        const mv=document.getElementById('mapViewOv');
        mv.classList.contains('show')?MapView.close():MapView.open();return}
      if(this.state==='vn'&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();this.advanceVN();return}
      if(this.state!=='playing')return;
      if(e.code==='Space'){e.preventDefault();this.doClean()}
      if(e.code==='KeyE')this.doPlant();
      if(e.code==='KeyQ')this.doCatch();
      if(e.code==='KeyF')this.doAttack();
    });
    window.addEventListener('keyup',e=>{this.keys[e.code]=false});

    cv.addEventListener('click',e=>{if(this.state!=='playing')return;
      const r=cv.getBoundingClientRect();
      this.targetX=(e.clientX-r.left)*(W/r.width);this.targetY=(e.clientY-r.top)*(H/r.height)});
  },

  pause(){
    this.state='paused';
    document.getElementById('pauseScr').classList.remove('hidden');
    if(typeof Mobile!=='undefined')Mobile.applyVisibility();
  },
  resume(){
    this.state='playing';
    document.getElementById('pauseScr').classList.add('hidden');
    if(typeof Mobile!=='undefined')Mobile.applyVisibility();
  },
  toMenu(){
    this.state='menu';
    ['pauseScr','overScr','hud','goalTracker'].forEach(id=>document.getElementById(id).classList.add('hidden'));
    this.closeInv();document.getElementById('menuScr').classList.remove('hidden');
    if(Save.g('chapter')>0)document.getElementById('btnContinue').style.display='block';
    if(typeof Mobile!=='undefined')Mobile.applyVisibility();
  },

  tileAt(c,r){return c<0||c>=COLS||r<0||r>=ROWS?-1:this.tiles[r][c]},
  setTile(c,r,v){if(c>=0&&c<COLS&&r>=0&&r<ROWS)this.tiles[r][c]=v},
  pCol(){return Math.floor(this.plx/TS)},pRow(){return Math.floor(this.ply/TS)},
  mapStats(){let tot=0,rest=0,pol=0,tr=0,trees=0;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=this.tiles[r][c];tot++;
      if(t===T.WAT){rest++;continue}if(t>=T.CLN&&t<=T.FLR)rest++;
      if(t>=T.T1&&t<=T.T3)trees++;if(t===T.POL)pol++;if(t===T.TRS)tr++}
    return{tot,rest,pol,tr,trees,pct:rest/tot}},

  comboAdd(){this.combo++;this.comboT=90;if(this.combo>this.comboHi)this.comboHi=this.combo;
    if(this.combo>=10)Trophies.unlock('combo_10');
    playBeep(500+this.combo*30,.08,'triangle');return 1+Math.floor(this.combo/3)*.5},

  earnCoins(n){const a=Math.floor(n);this.coins+=a;typeof addCoins==='function'?addCoins(a):Save.addCoins(a);
    if(Save.g('coins')>=1000)Trophies.unlock('rich');playBeep(800,.06)},
  // Single-source kill registration: HUD + goal tracker + boss spawn all read the same counter.
  registerKill(monsterType, options={}){
    const amount=Math.max(0, Number(options.amount)||1);
    if(!amount)return this.kills||0;

    this.kills=(this.kills||0)+amount;
    if(monsterType){
      if(!this.killsByType)this.killsByType={};
      this.killsByType[monsterType]=(this.killsByType[monsterType]||0)+amount;
    }

    if(typeof MapProgress!=='undefined'&&MapProgress){
      try{
        MapProgress.addKill(amount, monsterType);
        this.kills=Math.max(this.kills, MapProgress.kills||0);
        this.killsByType={...(this.killsByType||{}), ...(MapProgress.byType||{})};
      }catch(e){
        console.warn('[registerKill:MapProgress]',e);
        Save.load();
        Save.d.totalKills=(Save.d.totalKills||0)+amount;
        Save.save();
      }
    }else{
      Save.load();
      Save.d.totalKills=(Save.d.totalKills||0)+amount;
      Save.save();
    }

    const totalKills=Save.g('totalKills')||0;
    if(totalKills===1)Trophies.unlock('first_kill');
    if(totalKills>=50)Trophies.unlock('kill_50');

    if(typeof Quests!=='undefined'&&Quests&&Quests.progress){
      const completed=Quests.progress('kill', amount, monsterType);
      completed.forEach(qid=>{ if(Quests.db[qid]) Quests.complete(qid); });
    }

    const currentKills=Math.max(this.kills||0, (typeof MapProgress!=='undefined'&&MapProgress)?(MapProgress.kills||0):0);
    const hk=document.getElementById('hKills');
    if(hk){
      hk.textContent=currentKills;
      hk.classList.remove('kill-flash');
      void hk.offsetWidth;
      hk.classList.add('kill-flash');
    }

    if(options.showText!==false&&this.ftext){
      const fx=options.x??this.plx;
      const fy=(options.y??this.ply)-18;
      const label=amount>1?`+${amount} KILLS!`:'+1 KILL!';
      this.ftext.add(fx,fy,label,'#ff0',1.4);
    }
    if(options.playSound!==false&&typeof playBeep==='function')playBeep(440,.08,'square',.1);

    const mdAuto = typeof getCurrentMapData === 'function' ? getCurrentMapData() : null;
    if(mdAuto && (mdAuto.id === 'map1' || mdAuto.id === 'map2')) {
      let dirty = [];
      for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
          if(this.tiles && this.tiles[r] && (this.tiles[r][c] === T.POL || this.tiles[r][c] === T.TRS)) {
            dirty.push({r, c});
          }
        }
      }
      if(dirty.length > 0) {
        dirty.sort(() => Math.random() - 0.5);
        const amtClean = Math.min(dirty.length, Math.max(45, Math.floor(dirty.length * 0.45)));
        for(let i=0; i<amtClean; i++) {
          this.tiles[dirty[i].r][dirty[i].c] = T.CLN;
          if(Math.random() < 0.2) {
            this.parts.emit(dirty[i].c*TS+TS/2, dirty[i].r*TS+TS/2, 2, {xa:-1,xb:1,ya:-1,yb:1,la:10,lb:20,sa:1,sb:2,cs:['#4f8','#8ff']});
          }
        }
        if(typeof MapProgress !== 'undefined' && MapProgress) {
          MapProgress.addClean(amtClean);
        }
        if(this.ftext) {
          const fx = options.x ?? this.plx;
          const fy = (options.y ?? this.ply) - 35;
          this.ftext.add(fx, fy, `✨ 대지 자동 정화! (+${amtClean}칸)`, '#4f8', 1.5);
        }
      }
    }

    return currentKills;
  },

  doClean(){
    if(this.plCD>0)return;const c=this.pCol(),r=this.pRow(),t=this.tileAt(c,r);
    const cost=8;let ok=false;
    if(t===T.POL&&this.plEnergy>=cost){this.plEnergy-=cost;this.setTile(c,r,T.CLN);this.plCD=10;ok=true;
      Save.s('totalCleaned',Save.g('totalCleaned')+1);
      if(Save.g('totalCleaned')===1)Trophies.unlock('first_clean');
      if(Save.g('totalCleaned')>=100)Trophies.unlock('clean_100');
    }else if(t===T.TRS&&this.plEnergy>=cost*1.5){this.plEnergy-=cost*1.5;this.setTile(c,r,T.POL);this.plCD=14;ok=true;
      if(Math.random()<.3)this.plSeeds=Math.min(30,this.plSeeds+2)}
    if(ok){const m=this.comboAdd(),pts=Math.floor(15*m);this.score+=pts;
      this.earnCoins(Math.floor(2*m));
      if(typeof MapProgress!=='undefined')MapProgress.addClean();
      this.ftext.add(this.plx,this.ply-10,'+'+pts,'#8f8');
      this.parts.emit(this.plx,this.ply,4,{xa:-2,xb:2,ya:-2,yb:-.5,la:12,lb:25,sa:1,sb:2,cs:['#8f8','#af8','#6d6']});
      playBeep(520,.1)}},

  doPlant(){
    if(this.plCD>0)return;const c=this.pCol(),r=this.pRow(),t=this.tileAt(c,r);
    if(t===T.CLN&&this.plSeeds>=1&&this.plWater>=5){
      this.plSeeds--;this.plWater-=5;this.setTile(c,r,T.GRS);this.gTim[r][c]=0;this.plCD=14;
      const m=this.comboAdd(),pts=Math.floor(25*m);this.score+=pts;this.earnCoins(Math.floor(3*m));
      Save.s('totalPlanted',Save.g('totalPlanted')+1);
      if(Save.g('totalPlanted')>=50)Trophies.unlock('plant_50');

      this.ftext.add(this.plx,this.ply-10,'+'+pts,'#4f4');
      this.parts.emit(this.plx,this.ply,4,{xa:-1.5,xb:1.5,ya:-2,yb:-.5,la:15,lb:30,sa:1,sb:2,cs:['#4f4','#8f4','#2d8']});
      playBeep(440,.12,'triangle')}},

  doCatch(){for(let i=this.trash.length-1;i>=0;i--){const it=this.trash[i];
    if(Math.abs(it.x-this.plx)<18&&Math.abs(it.y-this.ply)<22&&it.y>this.ply-28){
      const m=this.comboAdd(),cn=Math.floor(it.c*1.5*m);this.score+=cn;this.earnCoins(cn);this.trCaught++;
      Save.s('totalTrashCaught',Save.g('totalTrashCaught')+1);
      if(Save.g('totalTrashCaught')>=10)Trophies.unlock('catch_trash');
      // (catch no longer tied to a quest)
      this.ftext.add(it.x,it.y,'+'+cn+'🪙','#fc0');
      this.parts.emit(it.x,it.y,4,{xa:-2,xb:2,ya:-2,yb:1,la:10,lb:20,sa:1,sb:2,cs:['#4f4','#8f8','#fff']});
      playBeep(600,.08,'square');this.trash.splice(i,1);return}}},

  doAttack(){
    Combat.attack(this);
  },

  killMonster(idx){
    Combat.killMonster(this, idx);
  },

  update(){
    if(this.state!=='playing')return;
    this.gameT++;this.frame++;
    // Hit-stop (frame freeze on impact)
    if(this._hitStopFrames>0){this._hitStopFrames--;return;}
    // Slow-mo
    const isSlowMo=this._slowMoFrames>0;
    if(isSlowMo)this._slowMoFrames--;
    if(isSlowMo)return;  // skip every other frame in slow-mo
    if(this._playerHitStop>0)this._playerHitStop--;

    let dx=0,dy=0;
    if(this.keys.ArrowLeft||this.keys.KeyA)dx-=1;if(this.keys.ArrowRight||this.keys.KeyD)dx+=1;
    if(this.keys.ArrowUp||this.keys.KeyW)dy-=1;if(this.keys.ArrowDown||this.keys.KeyS)dy+=1;
    if(this.joy&&this.joy.on){dx+=this.joy.dx;dy+=this.joy.dy}
    if(this.targetX!==null&&dx===0&&dy===0){
      const tdx=this.targetX-this.plx,tdy=this.targetY-this.ply,td=Math.hypot(tdx,tdy);
      if(td>3){dx=tdx/td;dy=tdy/td}else{this.targetX=null;this.targetY=null}}
    const mg=Math.hypot(dx,dy);
    if(mg>.1){dx/=mg;dy/=mg;this.plFrm+=.12;
      if(Math.abs(dx)>Math.abs(dy))this.plDir=dx>0?3:2;else this.plDir=dy>0?0:1}
    this.plx=CoreUtil.clamp(this.plx+dx*this.plSpd,PS/2,W-PS/2);
    this.ply=CoreUtil.clamp(this.ply+dy*this.plSpd,PS/2,H-PS/2);
    if(this.plInv>0)this.plInv--;if(this.plCD>0)this.plCD--;if(this.plAtkCD>0)this.plAtkCD--;
    if(this.plAttackAnim>0)this.plAttackAnim--;
    this.plEnergy=Math.min(this.plMaxEn,this.plEnergy+.03);

    const pc=this.pCol(),pr=this.pRow();
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      const nr=pr+dr,nc=pc+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&this.tiles[nr][nc]===T.WAT)
        this.plWater=Math.min(100,this.plWater+.12)}

    for(let i=this.books.length-1;i>=0;i--){
      const b=this.books[i];
      // Age-based auto-despawn (1 second = 60 frames)
      b._age=(b._age||0)+1;
      if(b._age>60){
        // Auto-despawn with fade particles
        this.parts.emit(b.x,b.y,3,{xa:-1,xb:1,ya:-1,yb:1,la:8,lb:15,sa:1,sb:1,cs:['#ca8','#ca8','#fff'],g:0.01});
        this.books.splice(i,1);
        continue;
      }
      if(CoreUtil.dist(this.plx,this.ply,b.x,b.y)<15){
        Inventory.add(b.id);
        this.ftext.add(b.x,b.y-10,'📖 책 획득!','#ca8');playBeep(500,.15,'triangle');
        this.books.splice(i,1)}}

    const rate=Math.max(15,70/(1+this.gameT*.00004));
    if(++this.trTimer>=rate){this.trTimer=0;const tp=TRASH[CoreUtil.randInt(0,TRASH.length-1)];
      const x=CoreUtil.rand(10,W-10);
      this.trash.push({x,y:-tp.h,w:tp.w,h:tp.h,s:tp.s*CoreUtil.rand(.8,1.2),d:tp.d,c:tp.c,n:tp.n,wb:CoreUtil.rand(0,6.28)});
      this.trWarns.push({x,t:25})}
    this.trWarns=this.trWarns.filter(w=>--w.t>0);
    for(let i=this.trash.length-1;i>=0;i--){const it=this.trash[i];it.y+=it.s;it.wb+=.06;it.x+=Math.sin(it.wb)*.4;
      if(it.y>H-it.h/2){const col=Math.floor(it.x/TS);
        if(col>=0&&col<COLS&&this.tileAt(col,ROWS-1)!==T.WAT&&this.tileAt(col,ROWS-1)!==T.ROK)
          this.setTile(col,ROWS-1,Math.random()<.3?T.TRS:T.POL);
        this.trDodged++;this.trash.splice(i,1);continue}
      if(Math.abs(it.x-this.plx)<(it.w/2+PS/2-2)&&Math.abs(it.y-this.ply)<(it.h/2+PS/2-2)){
        const mdCurr = typeof getCurrentMapData === 'function' ? getCurrentMapData() : null;
        const isBossAlive = this.monsters && this.monsters.some(m => m && (m.isBoss || m.behavior === 'boss'));
        const isFinalMap = mdCurr && mdCurr.id === 'map4';
        const isHarmful = isFinalMap || isBossAlive;
        if(isHarmful){
          if(this.plInv<=0){
            this.plHP=Math.max(0,this.plHP-it.d);this.plInv=50;/* shake removed */this.combo=0;
            this.parts.emit(this.plx,this.ply,6,{xa:-3,xb:3,ya:-3,yb:3,la:10,lb:20,sa:1,sb:3,cs:['#f44','#ff8','#fff']});
            playBeep(150,.1,'sawtooth');this.trash.splice(i,1);
          }
        } else {
          const m=this.comboAdd(), cn=Math.floor((it.c||1)*1.5*m);this.score+=cn;this.earnCoins(cn);this.trCaught++;
          Save.s('totalTrashCaught', (Save.g('totalTrashCaught')||0)+1);
          if(Save.g('totalTrashCaught')>=10)Trophies.unlock('catch_trash');
          this.ftext.add(it.x,it.y,'+'+cn+'🪙','#fc0');
          this.parts.emit(it.x,it.y,4,{xa:-2,xb:2,ya:-2,yb:1,la:10,lb:20,sa:1,sb:2,cs:['#4f4','#8f8','#fff']});
          playBeep(600,.08,'square');this.trash.splice(i,1);
        }
      }
    }

    const st=this.mapStats();
    const purityPct=Math.floor(st.pct*100);
    this.currentPurity=purityPct;

    Save.load();for(const qid of Save.d.activeQuests){
      const q=Quests.db[qid];if(q&&q.type==='purity')Save.d.questProgress[qid].current=purityPct}Save.save();
    const done=Quests.getActive().filter(q=>q.done);
    done.forEach(q=>{Quests.complete(q.id);this.ftext.add(this.plx,this.ply-20,'퀘스트 완료!','#fa0');
      playBeep(523,.15,'triangle');setTimeout(()=>playBeep(784,.1,'triangle'),150)});
    if(purityPct>=100)Trophies.unlock('purity_100');

    if(!this.bossProjectiles)this.bossProjectiles=[];
    MonsterAI.update(this);

    for(let i=this.bossProjectiles.length-1;i>=0;i--){
      const bp=this.bossProjectiles[i];bp.x+=bp.vx;bp.y+=bp.vy;bp.life--;
      if(bp.life<=0||bp.x<0||bp.x>W||bp.y<0||bp.y>H){this.bossProjectiles.splice(i,1);continue}
      if(this.plInv<=0&&CoreUtil.dist(bp.x,bp.y,this.plx,this.ply)<(bp.sz||4)+7){
        this.plHP=Math.max(0,this.plHP-bp.dmg);this.plInv=30;/* shake removed */
        this.parts.emit(bp.x,bp.y,4,{xa:-2,xb:2,ya:-2,yb:2,la:6,lb:12,sa:1,sb:2,cs:['#f44','#fa0']});
        playBeep(100,.1,'sawtooth');this.bossProjectiles.splice(i,1)}}

    if(++this.bookSpawnT>1800&&this.books.length<2){this.bookSpawnT=0;this.spawnBooks()}

    this.parts.update();this.ftext.update();

    if(this.comboT>0)this.comboT--;if(this.comboT<=0&&this.combo>0)this.combo=0;

    if(this.gameT%50===0)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
      if(this.tiles[r][c]===T.POL)[[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc])=>{const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&this.tiles[nr][nc]===T.CLN&&Math.random()<.003)this.tiles[nr][nc]=T.POL});
    const gm=this.rain?2:1;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=this.tiles[r][c];
      if(t>=T.GRS&&t<=T.FLR&&t!==T.TRS){this.gTim[r][c]+=gm;const th=t===T.GRS?250:t===T.FLR?400:180;
        if(this.gTim[r][c]>=th){this.gTim[r][c]=0;if(t===T.GRS)this.tiles[r][c]=Math.random()<.3?T.FLR:T.T1;
          else if(t===T.T1)this.tiles[r][c]=T.T2;else if(t===T.T2)this.tiles[r][c]=T.T3}}}

    this.dayT+=.00012;if(this.dayT>=1){this.dayT-=1;this.day++}
    if(--this.rainT<=0){this.rain=!this.rain;this.rainT=this.rain?CoreUtil.randInt(300,700):CoreUtil.randInt(500,1500);this.rainDrops=[]}
    if(this.rain){for(let i=0;i<3;i++)this.rainDrops.push({x:CoreUtil.rand(0,W),y:CoreUtil.rand(-10,-2),s:CoreUtil.rand(3,6),l:CoreUtil.rand(4,8)});
      for(let i=this.rainDrops.length-1;i>=0;i--){this.rainDrops[i].y+=this.rainDrops[i].s;if(this.rainDrops[i].y>H)this.rainDrops.splice(i,1)}
      if(this.gameT%25===0)this.plWater=Math.min(100,this.plWater+1)}

    const maxA=Math.floor(st.pct*8);
    if(++this.aniTimer>150&&this.animals.length<maxA&&st.pct>.1){this.aniTimer=0;
      const types=['bird','butterfly','rabbit','squirrel'];
      for(let a=0;a<15;a++){const c2=CoreUtil.randInt(0,COLS-1),r2=CoreUtil.randInt(0,ROWS-1);
        if(this.tileAt(c2,r2)>=T.GRS&&this.tileAt(c2,r2)<=T.FLR){
          this.animals.push({t:types[CoreUtil.randInt(0,types.length-1)],x:c2*TS+TS/2,y:r2*TS+TS/2,vx:CoreUtil.rand(-.3,.3),vy:CoreUtil.rand(-.3,.3),mt:CoreUtil.randInt(50,160),af:CoreUtil.rand(0,6.28)});break}}}
    while(this.animals.length>maxA+2)this.animals.pop();
    for(const a of this.animals){if(--a.mt<=0){a.mt=CoreUtil.randInt(50,160);a.vx=CoreUtil.rand(-.4,.4);a.vy=CoreUtil.rand(-.4,.4)}
      a.x=CoreUtil.clamp(a.x+a.vx,6,W-6);a.y=CoreUtil.clamp(a.y+a.vy,6,H-6);a.af+=.04}

    if(this.gameT%100===0&&st.trees>0){this.plSeeds=Math.min(30,this.plSeeds+Math.ceil(st.trees*.06));
      this.plEnergy=Math.min(this.plMaxEn,this.plEnergy+st.trees*.15)}

    /* shake removed */

    if(this.portal&&CoreUtil.dist(this.plx,this.ply,(this.portal.col+.5)*TS,(this.portal.row+.5)*TS)<15){
      if(this.portal.target==='ending'){
        try{location.href='endingcredit.html'}catch(e){}
      }else if(this.portal.target){
        Save.s('currentMap',this.portal.target);
        const targetMd=MapData[this.portal.target]||null;
        const targetChapter=targetMd?targetMd.chapter:(Save.g('chapter')+1);
        Save.s('chapter',Math.max(Save.g('chapter')||1,targetChapter));
        const mapIds=Object.keys(MapData);
        const targetIdx=mapIds.indexOf(this.portal.target);
        if(targetIdx>=0)Save.s('unlockedLevels',Math.max(Save.g('unlockedLevels')||1,targetIdx+1));
        Save.save();
        this.portal=null;
        playBeep(523,.15,'triangle'); setTimeout(() => playBeep(659,.15,'triangle'), 150);
        this.startGame();
      }
    }

    if(this.plHP<=0){this.state='dead';
      document.getElementById('hud').classList.add('hidden');document.getElementById('goalTracker').classList.add('hidden');
      document.getElementById('overScr').classList.remove('hidden');
      document.getElementById('overTitle').textContent='💀 쓰러졌습니다...';
      document.getElementById('overTitle').style.color='#f55';
      const reward=this.grantGameOverReward(purityPct);
      document.getElementById('overRes').innerHTML=`
        <div>점수: ${this.score}</div>
        <div>스테이지: ${reward.stage} (${reward.mapName})</div>
        <div>정화율: ${purityPct}%</div>
        <div>처치: ${Save.g('totalKills')}</div>
        <div style="margin-top:8px;color:#ffd45c;font-weight:800">보상 획득: +${reward.coins}🪙</div>
        <div style="font-size:10px;color:#aaa;margin-top:4px">스테이지와 정화율이 높을수록 더 많은 코인을 받습니다.</div>`;
      playBeep(200,.4,'sawtooth',.08);
      if(typeof Mobile!=='undefined')Mobile.applyVisibility();
    }

    if(this.trophyTimer>0){this.trophyTimer--;if(this.trophyTimer<=0)document.getElementById('trophyPopup').classList.remove('show')}
    const pending=Trophies.getPending();
    if(pending){const tr=TrophyDB[pending];if(tr){
      document.getElementById('tpIcon').textContent=tr.icon;
      document.getElementById('tpTitle').textContent=tr.name;
      document.getElementById('tpDesc').textContent=tr.desc;
      document.getElementById('trophyPopup').classList.add('show');this.trophyTimer=180;
      playBeep(784,.2,'triangle');setTimeout(()=>playBeep(1047,.15,'triangle'),200)}}

    this.updateHUD(st);
    this.updateGoalTracker();
  },

  updateHUD(st){
    document.getElementById('hLv').textContent=Save.g('level');
    document.getElementById('hName').textContent=Save.g('playerName');
    document.getElementById('bHP').style.width=(this.plHP/this.plMaxHP*100)+'%';document.getElementById('hHP').textContent=Math.floor(this.plHP);
    document.getElementById('bEN').style.width=(this.plEnergy/this.plMaxEn*100)+'%';document.getElementById('hEN').textContent=Math.floor(this.plEnergy);
    document.getElementById('hW').textContent=Math.floor(this.plWater);document.getElementById('hS').textContent=Math.floor(this.plSeeds);
    this.coins = typeof getCoins==='function'?getCoins():this.coins; document.getElementById('hCoin').textContent=this.coins;
    document.getElementById('bRST').style.width=Math.floor(st.pct*100)+'%';document.getElementById('hRST').textContent=Math.floor(st.pct*100)+'%';
    const pp=Math.floor((st.pol+st.tr)/st.tot*100);document.getElementById('bPOL').style.width=pp+'%';document.getElementById('hPOL').textContent=pp+'%';
    document.getElementById('hTime').textContent=`${this.day}일차`;
    document.getElementById('hCombo').textContent=this.combo>1?`x${this.combo}`:'';
    const currentKills=Math.max(this.kills||0, (typeof MapProgress!=='undefined'&&MapProgress)?(MapProgress.kills||0):0);
    this.kills=currentKills;
    const hk=document.getElementById('hKills');
    if(hk)hk.textContent=currentKills;
  },

  updateGoalTracker(){
    const prevKills=this._lastShownKills||0;
    const prevGoalCurrent=this._lastShownGoalCurrent||0;

    let md=null;
    try{
      if(typeof getCurrentMapData==='function')md=getCurrentMapData();
      else if(typeof MapData!=='undefined'){
        const mid=Save&&Save.g?Save.g('currentMap'):'map1';
        md=MapData[mid]||null;
      }
    }catch(e){console.warn('[goalTracker map]',e);}
    if(!md&&typeof MapData!=='undefined')md=MapData.map1;

    const currentKills=Math.max(this.kills||0, (typeof MapProgress!=='undefined'&&MapProgress)?(MapProgress.kills||0):0);
    this.kills=currentKills;

    let progress=null;
    if(typeof MapProgress!=='undefined'&&MapProgress&&MapProgress.getProgress){
      progress=MapProgress.getProgress();
    }
    if(!progress || (progress.current===0 && currentKills>0 && md && md.goal && md.goal.type==='kill')){
      const tg=md?.goal?.target||5;
      progress={
        current: Math.min(currentKills, tg),
        target: tg,
        percent: Math.min(currentKills/tg, 1),
        label: md?.goal?.label||'몬스터 5마리 처치',
        icon: md?.goal?.icon||'⚔️',
        done: currentKills>=tg
      };
    } else if(!progress){
      progress={ current:currentKills, target:1, percent:0, label:'', icon:'🎯', done:false };
    }

    const current=progress.current||0;
    const target=Math.max(1, progress.target||1);
    const percent=Math.max(0, Math.min(progress.percent||0, 1));
    const done=!!progress.done;
    const label=progress.label||'';
    const icon=progress.icon||'🎯';
    const mapName=md?`Ch.${md.chapter} — ${md.name}`:'Ch.?';

    try{
      const gtMapName=document.getElementById('gtMapName');
      const gtLabel=document.getElementById('gtLabel');
      const gtFill=document.getElementById('gtFill');
      const gtProgText=document.getElementById('gtProgText');
      const gtBreakdown=document.getElementById('gtBreakdown');
      if(gtMapName)gtMapName.textContent=mapName;
      if(gtLabel)gtLabel.innerHTML=`<span>${icon}</span><span>${label}</span>`;
      if(gtFill){
        gtFill.style.width=(percent*100)+'%';
        gtFill.classList.toggle('done',done);
      }
      if(gtProgText){
        gtProgText.innerHTML=
          `<span class="gt-current">${current}/${target}</span><span class="gt-percent">${Math.floor(percent*100)}%</span>`;
        gtProgText.classList.toggle('done',done);
      }

      if(currentKills>prevKills||current>prevGoalCurrent){
        const gt=document.getElementById('goalTracker');
        if(gt){
          gt.classList.remove('flash-update');
          void gt.offsetWidth;
          gt.classList.add('flash-update');
          setTimeout(()=>gt.classList.remove('flash-update'),400);
        }
      }
      this._lastShownKills=currentKills;
      this._lastShownGoalCurrent=current;

      if(gtBreakdown&&md&&md.monsters){
        const mpByType=(typeof MapProgress!=='undefined'&&MapProgress&&MapProgress.byType)?MapProgress.byType:{};
        const gByType=this.killsByType||{};
        const byType={...mpByType};
        for(const k in gByType){ byType[k]=Math.max(byType[k]||0, gByType[k]||0); }

        const max=md.monsterMax||{};
        gtBreakdown.innerHTML=md.monsters.map(type=>{
          const mdb=MonsterDB[type]||ExtMonsters[type];
          const killed=byType[type]||0;
          const maxCount=max[type]||1;
          return `<span class="gt-mon" title="${mdb?.name||type}">${mdb?.icon||'?'} ${killed}/${maxCount}</span>`;
        }).join('');
      }
    }catch(e){console.warn('[goalTracker DOM]',e);}

    try{
      const warn=document.getElementById('gtBossWarn');
      if(warn)warn.remove();
      if(done&&this.monsters&&!this.monsters.some(m=>m.isBoss)&&md&&md.boss){
        const w=document.createElement('div');
        w.id='gtBossWarn';w.className='gt-boss-warning';
        w.textContent='⚠️ 보스 등장!';
        const gt=document.getElementById('goalTracker');
        if(gt)gt.appendChild(w);
      }
    }catch(e){}
  },

  draw(){
    cx.save();
    if(this.shake>0)/* shake removed */
    cx.fillStyle='#111';cx.fillRect(-3,-3,W+6,H+6);

    if(this.state==='menu'){
      const t=Date.now()*.001;cx.fillStyle='rgba(5,15,10,.93)';cx.fillRect(0,0,W,H);
      for(let i=0;i<COLS;i++){const ph=(t*.4+i*.6)%3;
        if(ph<1)px(i*TS+8,H-12,4,8,'#3a5a2a');
        else if(ph<2){px(i*TS+8,H-20,3,16,'#6b4226');px(i*TS+5,H-25,9,7,'#3a8a2a')}
        else{px(i*TS+8,H-28,4,24,'#6b4226');px(i*TS+3,H-35,14,10,'#2a7a1a')}}
      cx.restore();return}

    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)drawTile(c*TS,r*TS,this.tiles[r][c],this.frame);

    if(this.portal)drawPortal(this.portal.col*TS,this.portal.row*TS,this.frame);

    for(const b of this.books)drawBook(b,this.frame);

    for(const a of this.animals){const p=Math.floor(a.x),q=Math.floor(a.y),fr=Math.floor(a.af*2)%2;
      if(a.t==='bird'){px(p-3,q-1,6,3,'#48f');if(fr){px(p-4,q-3,3,2,'#69c');px(p+1,q-3,3,2,'#69c')}}
      else if(a.t==='butterfly'){px(p,q-2,1,4,'#333');if(fr){px(p-3,q-2,3,3,'#f8c');px(p+1,q-2,3,3,'#fad')}else{px(p-2,q-1,2,2,'#f8c');px(p+1,q-1,2,2,'#fad')}}
      else if(a.t==='squirrel'){px(p-2,q,4,3,'#a64');px(p+1,q-2,3,3,'#a64');px(p+1,q-5,1,3,'#a64');px(p+3,q-5,1,3,'#a64')}
      else{px(p-2,q,4,3,'#db8');px(p+1,q-2,3,3,'#db8');px(p+1,q-5,1,3,'#db8');px(p+3,q-5,1,3,'#db8')}}

    for(const m of this.monsters)drawMonster(m,this.frame);

    drawPlayer(this.plx,this.ply,this.plDir,this.plFrm,this.plInv,this.plColors,this.plAttackAnim);

    for(const w of this.trWarns){cx.globalAlpha=w.t/25*.3;px(w.x-1,0,2,35,'#f88');cx.globalAlpha=1}
    for(const it of this.trash)drawTrash(it.x,it.y,it.n);

    this.parts.draw();this.ftext.draw();

    if(this.dayT>.75||this.dayT<.2){cx.fillStyle='rgba(8,8,30,.3)';cx.fillRect(0,0,W,H)}
    if(this.rain){cx.fillStyle='rgba(20,30,50,.1)';cx.fillRect(0,0,W,H);
      for(const d of this.rainDrops)px(d.x,d.y,1,d.l,'rgba(140,170,210,.2)')}

    if(this.state==='playing'){
      cx.strokeStyle=this.frame%20<10?'rgba(255,255,100,.25)':'rgba(255,255,100,.1)';
      cx.lineWidth=1;cx.strokeRect(this.pCol()*TS,this.pRow()*TS,TS,TS)}

    cx.restore();

    // === ENVIRONMENTAL TENSION (DOM overlays) ===
    try{
      // Night overlay
      const isNight=this.dayT<0.25||this.dayT>0.75;
      const nightEl=document.getElementById('nightOverlay');
      if(nightEl){
        const intensity=isNight?Math.min(1,(isNight?0.5:0)+(isNight?0.5:0)):0;
        nightEl.style.opacity=intensity;
      }
      // HP warning vignette
      const hpPct=this.plHP/this.plMaxHP;
      const vigEl=document.getElementById('hpVignette');
      if(vigEl){
        if(hpPct<0.3){
          vigEl.style.opacity=(Math.sin(Date.now()*0.005)*0.3+0.5)*(0.7-hpPct*2);
        }else if(hpPct<0.5){
          vigEl.style.opacity=0.15;
        }else{
          vigEl.style.opacity=0;
        }
      }
      // Screen flash (impact)
      const flashEl=document.getElementById('screenFlash');
      if(flashEl&&this._flashFrames>0){
        this._flashFrames--;
        flashEl.style.background=this._flashColor;
        flashEl.style.opacity=this._flashAlpha;
      }else if(flashEl){
        flashEl.style.opacity=0;
      }
    }catch(e){}
  },

  lastT:0,
  _loopRunning:false,
  _loopFrameId:null,
  loop(ts){
    // CRITICAL: only schedule next frame ONCE per call.
    // Previous version scheduled rAF twice → exponential growth → page freeze.
    if(!this._loopRunning)return;
    this._loopFrameId=requestAnimationFrame(t=>this.loop(t));
    this.lastT=ts||Date.now();
    try{this.update();}catch(e){console.error('[G.update]',e);}
    try{this.draw();}catch(e){console.error('[G.draw]',e);}
  },
  startLoop(){
    if(this._loopRunning)return;
    this._loopRunning=true;
    this.loop(0);
  },
  stopLoop(){
    this._loopRunning=false;
    if(this._loopFrameId){cancelAnimationFrame(this._loopFrameId);this._loopFrameId=null;}
  }
};
// Auto-start the loop on first init
window.G = window.G || (typeof G!=='undefined'?G:null);
window.Game = window.G;

// Expose G to global scope for debug, mobile.js, and other modules
try { window.G = G; window.Game = G; } catch(e){}

G.init();

// Auto-start the loop (in case init didn't)
if (window.G && window.G.startLoop) window.G.startLoop();
