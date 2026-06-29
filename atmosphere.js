// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — ATMOSPHERIC ZONE UPDATE
//  목표: 특정 게임의 에셋/엔진 복제가 아니라, 폐허·이상현상·오염 경보가 있는
//  어둡고 건조한 포스트 환경 재난 분위기를 캔버스/DOM만으로 구현한다.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const ZoneAtmosphere = {
  palettes: {
    map1: { fog:'rgba(105,88,52,', sky:'#181713', accent:'#d5b56b', dust:'#b99a5a', name:'매립지 먼지' },
    map2: { fog:'rgba(120,125,120,', sky:'#13161a', accent:'#b8c0a8', dust:'#c8c8b0', name:'미세먼지 정체' },
    map3: { fog:'rgba(85,120,140,', sky:'#101820', accent:'#8cc7d6', dust:'#bddde2', name:'염분 안개' },
    map4: { fog:'rgba(125,55,35,', sky:'#150b09', accent:'#ff8a5c', dust:'#d46d4b', name:'복합오염 열기' },
  },
  state: {
    mapId:null,
    rad:0,
    anomaly:0,
    air:100,
    wind:0,
    warningT:0,
    scanT:0,
    particles:[],
  },
  initMap(game){
    if(!game)return;
    const mapId=(Save.g&&Save.g('currentMap'))||'map1';
    this.state.mapId=mapId;
    this.state.rad=0; this.state.anomaly=0; this.state.air=100;
    this.state.wind=CoreUtil.rand(-0.45,0.45);
    this.state.particles=[];
    const md=(typeof MapData!=='undefined'&&MapData[mapId])||{};
    const diff=Math.max(1,md.difficulty||1);
    const count=(md.zoneAnomalyCount!==undefined)?md.zoneAnomalyCount:(2+diff*2);
    game.anomalies=[];
    const types=['chemical','static','sink','ash'];
    for(let i=0;i<count;i++){
      let x=0,y=0,tries=0;
      do{
        x=CoreUtil.randInt(2,17)*20+10;
        y=CoreUtil.randInt(2,12)*20+10;
        tries++;
      }while(game.tileAt&&game.tileAt(Math.floor(x/20),Math.floor(y/20))===T.WAT&&tries<20);
      if(CoreUtil.dist(x,y,game.plx,game.ply)<70){x=CoreUtil.clamp(x+90,25,375);y=CoreUtil.clamp(y+50,25,275)}
      const type=types[(i+diff)%types.length];
      game.anomalies.push({
        type,x,y,
        r:CoreUtil.rand(20,34)+diff*2,
        phase:CoreUtil.rand(0,Math.PI*2),
        power:0.65+diff*0.18+CoreUtil.rand(0,.25),
        discovered:false,
      });
    }
    this.ensurePanel();
    this.updatePanel(game);
  },
  ensurePanel(){
    if(document.getElementById('zonePanel'))return;
    const el=document.createElement('div');
    el.id='zonePanel';
    el.innerHTML=`
      <div class="zp-title">FIELD DETECTOR</div>
      <div class="zp-row"><span>☢ 오염선량</span><b id="zpRad">0.00</b></div>
      <div class="zp-meter"><i id="zpRadBar"></i></div>
      <div class="zp-row"><span>◌ 이상현상</span><b id="zpAnom">0%</b></div>
      <div class="zp-meter warn"><i id="zpAnomBar"></i></div>
      <div class="zp-row"><span>↯ 대기질</span><b id="zpAir">100</b></div>
      <div class="zp-status" id="zpStatus">감시 중</div>`;
    const root=document.getElementById('game')||document.body;
    root.appendChild(el);
  },
  updatePanel(game){
    const r=Math.max(0,Math.min(1,this.state.rad));
    const a=Math.max(0,Math.min(1,this.state.anomaly));
    const air=Math.max(0,Math.min(100,this.state.air));
    const $=id=>document.getElementById(id);
    if($('zpRad'))$('zpRad').textContent=(r*3.6).toFixed(2);
    if($('zpRadBar'))$('zpRadBar').style.width=(r*100)+'%';
    if($('zpAnom'))$('zpAnom').textContent=Math.floor(a*100)+'%';
    if($('zpAnomBar'))$('zpAnomBar').style.width=(a*100)+'%';
    if($('zpAir'))$('zpAir').textContent=Math.floor(air);
    if($('zpStatus')){
      let txt='감시 중';
      if(a>.72)txt='이상현상 접근';
      else if(r>.62)txt='오염선량 상승';
      else if(air<42)txt='대기질 악화';
      $('zpStatus').textContent=txt;
      $('zpStatus').classList.toggle('danger',a>.72||r>.7||air<35);
    }
  },
  update(game){
    if(!game||game.state!=='playing')return;
    if(!game.anomalies)this.initMap(game);
    const mapId=(Save.g&&Save.g('currentMap'))||'map1';
    if(this.state.mapId!==mapId)this.initMap(game);

    // Ambient field particles: ash/dust/plastic salt mist.
    const pal=this.palettes[mapId]||this.palettes.map1;
    if(Math.random()<0.45){
      this.state.particles.push({
        x:CoreUtil.rand(-15,415), y:CoreUtil.rand(-5,305),
        vx:this.state.wind+CoreUtil.rand(-.08,.08), vy:CoreUtil.rand(.05,.28),
        l:CoreUtil.randInt(80,180), ml:160,
        c:pal.dust,
      });
    }
    for(let i=this.state.particles.length-1;i>=0;i--){
      const p=this.state.particles[i];p.x+=p.vx;p.y+=p.vy;p.l--;
      if(p.l<=0||p.x<-30||p.x>430||p.y>330)this.state.particles.splice(i,1);
    }
    while(this.state.particles.length>90)this.state.particles.shift();

    // Compute anomaly/radiation pressure.
    let nearest=999, pressure=0;
    for(const an of game.anomalies||[]){
      an.phase+=0.035*an.power;
      const d=CoreUtil.dist(game.plx,game.ply,an.x,an.y);
      nearest=Math.min(nearest,d);
      const p=Math.max(0,1-d/(an.r*2.15))*an.power;
      pressure=Math.max(pressure,p);
      if(d<an.r*0.72){
        an.discovered=true;
        if(game.plInv<=0 && game.frame%26===0){
          const dmg=an.type==='sink'?5:an.type==='static'?4:3;
          game.plHP=Math.max(0,game.plHP-dmg);
          game.plInv=12;
          if(game.ftext)game.ftext.add(game.plx,game.ply-18,this.anomalyName(an.type)+' -'+dmg,'#ff9a72',1);
          if(game.parts)game.parts.emit(game.plx,game.ply,6,{xa:-2,xb:2,ya:-2,yb:2,la:8,lb:18,sa:1,sb:2,cs:['#ff8','#f84','#fff'],g:.01});
          playBeep(70,.12,'sawtooth',.08);
        }
      }else if(d<an.r*1.7 && !an.discovered && game.ftext && game.frame%90===0){
        game.ftext.add(game.plx,game.ply-24,'검출기 신호가 불안정하다','#ffd37a',.9);
      }
    }
    const pc=game.pCol?game.pCol():Math.floor(game.plx/20), pr=game.pRow?game.pRow():Math.floor(game.ply/20);
    let polluted=0;
    for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){
      const t=game.tileAt&&game.tileAt(pc+dc,pr+dr);
      if(t===T.POL||t===T.TRS||t===T.LAV)polluted++;
    }
    const radTarget=Math.min(1,pressure*.75+polluted/35+(mapId==='map4' ? .18 : 0));
    this.state.rad=CoreUtil.lerp(this.state.rad,radTarget,.045);
    this.state.anomaly=CoreUtil.lerp(this.state.anomaly,Math.min(1,pressure),.08);
    const airTarget=Math.max(18,100-(polluted*2.4)-(this.state.rad*45)-((mapId==='map2')?18:0));
    this.state.air=CoreUtil.lerp(this.state.air,airTarget,.025);
    if(game.plInv<=0 && game.frame%120===0 && (this.state.rad>.7||this.state.air<32)){
      game.plHP=Math.max(0,game.plHP-2);
      if(game.ftext)game.ftext.add(game.plx,game.ply-20,'오염 노출 -2','#cfa0ff',.9);
    }
    if(game.frame%20===0)this.updatePanel(game);
  },
  anomalyName(type){
    return {chemical:'화학 웅덩이',static:'정전기 이상',sink:'침강 이상',ash:'고열 재 낙진'}[type]||'이상현상';
  },
  anomalyColor(type,alpha=1){
    const c={chemical:`rgba(150,255,95,${alpha})`,static:`rgba(130,190,255,${alpha})`,sink:`rgba(210,160,255,${alpha})`,ash:`rgba(255,125,70,${alpha})`};
    return c[type]||`rgba(255,220,120,${alpha})`;
  },
  drawUnder(cx,game){
    if(!cx||!game)return;
    const mapId=this.state.mapId||'map1';
    const pal=this.palettes[mapId]||this.palettes.map1;
    // Ground fog patches.
    cx.save();
    for(let i=0;i<7;i++){
      const x=((game.frame*.08*(i%2?1:-1)+i*73)%470)-35;
      const y=(i*41+Math.sin(game.frame*.01+i)*10)%310;
      const g=cx.createRadialGradient(x,y,2,x,y,65+i*4);
      g.addColorStop(0,pal.fog+'0.13)');g.addColorStop(1,pal.fog+'0)');
      cx.fillStyle=g;cx.fillRect(x-80,y-70,160,140);
    }
    // Anomaly fields.
    for(const an of game.anomalies||[]){
      const pulse=.72+Math.sin(an.phase)*.18;
      const rr=an.r*pulse;
      const grad=cx.createRadialGradient(an.x,an.y,2,an.x,an.y,rr);
      grad.addColorStop(0,this.anomalyColor(an.type,.22));
      grad.addColorStop(.55,this.anomalyColor(an.type,.08));
      grad.addColorStop(1,this.anomalyColor(an.type,0));
      cx.fillStyle=grad;cx.beginPath();cx.arc(an.x,an.y,rr,0,Math.PI*2);cx.fill();
      if(an.discovered||this.state.anomaly>.45){
        cx.strokeStyle=this.anomalyColor(an.type,.34+.22*Math.sin(an.phase));
        cx.lineWidth=1;
        cx.beginPath();cx.arc(an.x,an.y,an.r*(.9+.1*Math.sin(an.phase*1.7)),0,Math.PI*2);cx.stroke();
      }
    }
    cx.restore();
  },
  drawOver(cx,game){
    if(!cx||!game)return;
    const mapId=this.state.mapId||'map1';
    const pal=this.palettes[mapId]||this.palettes.map1;
    cx.save();
    // Dust particles over scene.
    for(const p of this.state.particles){
      cx.globalAlpha=Math.max(0,Math.min(.28,p.l/(p.ml||160)));
      cx.fillStyle=p.c;cx.fillRect(p.x,p.y,1,1);
    }
    cx.globalAlpha=1;
    // Detector interference near anomaly.
    if(this.state.anomaly>.35){
      cx.globalAlpha=Math.min(.22,this.state.anomaly*.28);
      cx.fillStyle=this.anomalyColor('static',1);
      for(let y=0;y<300;y+=7){cx.fillRect(0,y+Math.sin(game.frame*.2+y)*1.2,400,1)}
      cx.globalAlpha=1;
    }
    // Radiation tint.
    if(this.state.rad>.25){
      cx.globalAlpha=Math.min(.25,this.state.rad*.22);
      cx.fillStyle=pal.fog+'1)';cx.fillRect(0,0,400,300);
      cx.globalAlpha=1;
    }
    // Vignette.
    const vg=cx.createRadialGradient(200,150,70,200,150,245);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(.65,'rgba(0,0,0,.18)');
    vg.addColorStop(1,'rgba(0,0,0,.68)');
    cx.fillStyle=vg;cx.fillRect(0,0,400,300);
    // Film grain, sparse for performance.
    cx.globalAlpha=.08;
    cx.fillStyle='#fff';
    for(let i=0;i<65;i++)cx.fillRect((Math.random()*400)|0,(Math.random()*300)|0,1,1);
    cx.globalAlpha=1;
    cx.restore();
  },
};

if(typeof window!=='undefined')window.ZoneAtmosphere=ZoneAtmosphere;
console.log('[ATMOSPHERE] Zone atmosphere loaded.');
