// ═══════════════════════════════════════════════════════════════════════════
//  ECORESTORE — IN-GAME STORYLINE EXPANSION
//  별도 인물이 아니라 사회의 기록, 자동 경보, 주인공의 현장 기록으로만 진행.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const StorylineDialogues = {
  map1_milestone_25: [
    { speaker:'현장 기록', text:'폐허 분지의 첫 신고는 냄새였다. 다음은 물 색, 그 다음은 피부 발진이었다.' },
    { speaker:'행정 기록', text:'민원 접수. 현장 확인 예정. 처리 상태: 보류. 같은 문장이 여러 달 반복되어 있다.' },
    { speaker:'주인공 기록', text:'처음부터 괴물이 있었던 게 아니다. 신고가 있었고, 문서가 있었고, 아무도 충분히 움직이지 않았다.' },
  ],
  map1_milestone_55: [
    { speaker:'현장 기록', text:'폐공장 배수로 근처에서 같은 업체명이 적힌 포장재가 반복적으로 발견된다.' },
    { speaker:'행정 기록', text:'업체는 폐업 처리. 책임 주체 불명. 오염 물질은 여전히 토양에 남아 있다.' },
    { speaker:'주인공 기록', text:'폐업은 끝이 아니다. 땅은 서류보다 오래 기억한다.' },
  ],
  map1_milestone_85: [
    { speaker:'대피 기록', text:'분지 대피자 대부분은 멀리 가지 못했다. 새 지역에서도 물값과 병원비가 필요했다.' },
    { speaker:'현장 기록', text:'환경 피해는 이사로 끝나지 않는다. 몸에 남고, 빚으로 남고, 다음 세대의 생활 반경에 남는다.' },
  ],

  map2_milestone_25: [
    { speaker:'관측소 백업', text:'미세먼지 수치가 기준을 넘은 날에도 공장 가동률은 줄지 않았다.' },
    { speaker:'보건 통계', text:'호흡기 증상 접수 증가. 외부 활동 제한 권고. 생산량 그래프와 같은 방향으로 움직인다.' },
    { speaker:'주인공 기록', text:'보이지 않는 피해는 자주 늦게 인정된다. 그 사이 피해자는 자기 몸으로 증명해야 했다.' },
  ],
  map2_milestone_55: [
    { speaker:'운송 기록', text:'폐필터 운반 경로 확인. 덮개 불량, 밀폐 실패, 강풍 시 운행 지속.' },
    { speaker:'작업 지침', text:'세부 목적지 확인 불필요. 처리 업체 인계 후 책임 종료.' },
    { speaker:'주인공 기록', text:'몰라도 된다는 말은 책임을 줄이지 않았다. 모르는 채로 옮긴 것도 이 오염의 일부다.' },
  ],
  map2_milestone_85: [
    { speaker:'학교 공지', text:'야외 활동 중지. 처음엔 일주일, 이후 한 학기 전체로 연장.' },
    { speaker:'현장 기록', text:'아이들은 하늘이 원래 회색이라고 배웠다. 그것이 가장 오래 남는 피해일지도 모른다.' },
  ],

  map3_milestone_25: [
    { speaker:'해안 연구 기록', text:'큰 플라스틱은 줄어든 것처럼 보인다. 작은 조각은 늘었다.' },
    { speaker:'현장 기록', text:'분해된 게 아니라 추적하기 어려워졌다. 작아진 오염은 더 멀리 간다.' },
    { speaker:'주인공 기록', text:'모래는 깨끗해 보이지만, 손바닥 위에 남는 반짝임이 너무 많다.' },
  ],
  map3_milestone_55: [
    { speaker:'생태 조사', text:'해양 생물 위장에서 병뚜껑 조각과 낚싯줄이 함께 발견됐다.' },
    { speaker:'현장 기록', text:'생태계 피해는 하나의 원인으로 끝나지 않는다. 그래서 책임을 나누기 쉽고, 그래서 아무도 충분히 책임지지 않는다.' },
  ],
  map3_milestone_85: [
    { speaker:'해류 기록', text:'해안 쓰레기의 출처는 여러 지역으로 갈라진다. 내륙, 항만, 외해, 무단 투기 지점.' },
    { speaker:'현장 기록', text:'바다는 출처를 구분하지 않는다. 들어온 것은 섞이고, 섞인 것은 모두의 문제가 된다.' },
    { speaker:'주인공 기록', text:'지금 걷어내는 것은 일부다. 중요한 건 더 들어오지 않게 만드는 것이다.' },
  ],

  map4_milestone_20: [
    { speaker:'통합 경보', text:'분지, 협곡, 해안의 오염 경로가 같은 좌표로 수렴한다.' },
    { speaker:'현장 기록', text:'오염의 심장은 중심지가 아니다. 방치된 문제들이 마지막에 모이는 곳이다.' },
  ],
  map4_milestone_45: [
    { speaker:'운송 기록', text:'마지막 폐기물 경로가 이 구역으로 찍혀 있다. 목적지 미확인. 인계 서명 누락.' },
    { speaker:'주인공 기록', text:'기록의 빈칸이 가장 많은 곳일수록, 실제로는 가장 많은 일이 일어났다.' },
  ],
  map4_milestone_70: [
    { speaker:'표본 분석', text:'토양, 물, 공기 표본이 모두 한계치를 넘었다. 하지만 생명 반응이 완전히 사라지진 않았다.' },
    { speaker:'현장 기록', text:'복구 가능성이 있다는 뜻이다. 쉽다는 뜻은 아니다.' },
    { speaker:'주인공 기록', text:'희망은 낙관이 아니다. 남은 가능성을 확인하고, 그 가능성을 망치지 않기로 결정하는 일이다.' },
  ],
  map4_milestone_92: [
    { speaker:'현장 경보', text:'대형 오염체 활동 임계치 접근. 주변 폐기물과 오염 입자가 한 지점으로 끌려가고 있다.' },
    { speaker:'주인공 기록', text:'이걸 괴물이라고 부르면 편하다. 하지만 이름을 붙이기 전에 원인을 봐야 한다.' },
    { speaker:'시스템', text:'마지막 대응 준비. 낙하 폐기물, 이상현상, 체력, 에너지 상태를 확인하라.' },
  ],

  first_choice_event: [
    { speaker:'시스템', text:'현장에서는 늘 정답이 보이지 않는다. 자원은 부족하고, 시간은 부족하고, 피해는 이미 진행 중이다.' },
    { speaker:'주인공 기록', text:'선택지는 선과 악으로 나뉘지 않는다. 어떤 피해를 줄이고, 어떤 기록을 남기고, 어떤 위험을 감수할지 결정해야 한다.' },
  ],

  long_rest: [
    { speaker:'현장 기록', text:'밤이 깊어지면 폐기물 낙하 소리가 더 잘 들린다. 금속이 바닥에 닿는 소리, 비닐이 철망에 걸리는 소리.' },
    { speaker:'주인공 기록', text:'사람이 떠난 곳도 조용하지 않다. 오염은 계속 움직이고, 구조물은 계속 무너지고, 기록은 계속 젖어간다.' },
  ],

  dlc_black_rain_intro: [
    { speaker:'비상방송', text:'추가 작전 개방: 검은 비. 강우 예보와 함께 낙하 폐기물 밀도가 상승한다.' },
    { speaker:'시스템', text:'검은 비 작전 중에는 수거와 정화를 미루면 오염이 빠르게 확산된다. 보상보다 방지가 중요하다.' },
  ],
};

const StorylineRuntime = {
  thresholds: [
    { p:0.25, suffix:'25' },
    { p:0.55, suffix:'55' },
    { p:0.85, suffix:'85' },
  ],
  map4Thresholds: [
    { p:0.20, suffix:'20' },
    { p:0.45, suffix:'45' },
    { p:0.70, suffix:'70' },
    { p:0.92, suffix:'92' },
  ],
  update(game){
    if(!game || game.state!=='playing' || typeof MapProgress==='undefined' || typeof StoryDialogues==='undefined') return;
    if(game.vnActive) return;
    const mapId=(Save.g&&Save.g('currentMap'))||'map1';
    const prog=MapProgress.getProgress ? MapProgress.getProgress() : null;
    if(!prog) return;
    const arr=mapId==='map4'?this.map4Thresholds:this.thresholds;
    for(const th of arr){
      if((prog.percent||0)>=th.p){
        const id=`${mapId}_milestone_${th.suffix}`;
        const flag=`storyline_${id}`;
        if(StoryDialogues[id] && !Save.flag(flag)){
          Save.setFlag(flag,true);
          setTimeout(()=>{ if(game.state==='playing') game.startVN(id); },180);
          return;
        }
      }
    }
    if((Save.g('choiceEventsSeen')||0)>=1 && !Save.flag('storyline_first_choice_event') && StoryDialogues.first_choice_event){
      Save.setFlag('storyline_first_choice_event',true);
      setTimeout(()=>{ if(game.state==='playing') game.startVN('first_choice_event'); },220);
      return;
    }
    if((Save.g('unlockedLevels')||1)>=3 && !Save.flag('storyline_dlc_black_rain_intro') && StoryDialogues.dlc_black_rain_intro){
      Save.setFlag('storyline_dlc_black_rain_intro',true);
      setTimeout(()=>{ if(game.state==='playing') game.startVN('dlc_black_rain_intro'); },220);
      return;
    }
    if((game.day||1)>=3 && !Save.flag('storyline_long_rest') && StoryDialogues.long_rest){
      Save.setFlag('storyline_long_rest',true);
      setTimeout(()=>{ if(game.state==='playing') game.startVN('long_rest'); },220);
    }
  }
};

if(typeof window!=='undefined'){
  window.StorylineDialogues=StorylineDialogues;
  window.StorylineRuntime=StorylineRuntime;
  if(window.StoryDialogues) Object.assign(window.StoryDialogues, StorylineDialogues);
}

console.log('[STORYLINE] In-game storyline loaded:', Object.keys(StorylineDialogues).length);
