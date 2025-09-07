// 음악 파일 목록을 정의합니다.
const musicList = [
    'ad1.mp3',
    'ad2.mp3',
    'ad3.mp3'
];

let currentMusicIndex = 0;
const audioPlayer = new Audio();

// 다음 음악으로 넘어가는 함수
function playNextMusic() {
    // 현재 인덱스가 음악 목록의 마지막에 도달하면 처음으로 돌아갑니다.
    if (currentMusicIndex >= musicList.length) {
        currentMusicIndex = 0;
    }

    audioPlayer.src = musicList[currentMusicIndex];
    audioPlayer.play().catch(error => {
        console.error('자동 재생 실패. 사용자의 상호 작용이 필요할 수 있습니다:', error);
        // 사용자에게 재생 버튼을 클릭하도록 유도하는 메시지를 표시할 수 있습니다.
        // 예시: showToast('음악을 재생하려면 화면을 한 번 클릭해주세요.', 'info');
    });

    currentMusicIndex++;
}

// 오디오가 끝날 때마다 다음 음악을 재생하도록 이벤트 리스너를 추가합니다.
audioPlayer.addEventListener('ended', () => {
    playNextMusic();
});

// 페이지가 로드되면 음악 재생을 시작합니다.
// 브라우저 정책에 따라 자동 재생이 차단될 수 있으므로,
// play()는 프로미스를 반환하며, 오류 처리를 추가하는 것이 좋습니다.
window.addEventListener('load', () => {
    playNextMusic();
});
