/* 정보 개념 체험관 · 단원과 활동 목록 (첫 화면과 활동 페이지가 함께 사용)
   새 활동은 contentsList에 교과서 쪽수 순서로 추가한다. lesson: true = 45분 종합 수업 */
const unitList = [
  {unit: 1, name: '컴퓨팅 시스템', desc: '컴퓨팅 시스템의 구성과 동작, 피지컬 컴퓨팅'},
  {unit: 2, name: '데이터', desc: '데이터의 디지털 표현, 수집과 관리, 구조화와 해석'},
  {unit: 3, name: '알고리즘과 프로그래밍', desc: '문제 분석과 추상화, 알고리즘 설계, 프로그래밍'},
  {unit: 4, name: '인공지능', desc: '인공지능의 개념과 시스템, 활용과 윤리'},
  {unit: 5, name: '디지털 문화', desc: '디지털 사회와 직업, 정보 윤리, 개인 정보와 저작권'},
];

const subList = {
  '1-1-1': '컴퓨팅 시스템의 구성과 동작 · 01 컴퓨팅 시스템의 구성',
  '1-1-2': '컴퓨팅 시스템의 구성과 동작 · 02 컴퓨팅 시스템의 동작',
  '1-2-1': '피지컬 컴퓨팅 시스템 · 01 피지컬 컴퓨팅 시스템의 구성',
  '1-2-2': '피지컬 컴퓨팅 시스템 · 02 스마트 교실 · 단원 정리와 프로젝트',
  '2-1-1': '데이터의 표현과 관리 · 01 데이터의 디지털 표현',
  '2-1-2': '데이터의 표현과 관리 · 02 데이터의 수집과 관리',
  '2-2-1': '데이터의 구조화와 해석 · 01 데이터의 구조화',
  '2-2-2': '데이터의 구조화와 해석 · 02 데이터의 해석',
  '2-2-3': '데이터의 구조화와 해석 · 03 우리 반 체력 분석하기 · 단원 정리와 프로젝트',
  '3-1-1': '알고리즘 · 01 문제의 이해와 추상화 · 02 알고리즘 기초',
  '3-1-2': '알고리즘 · 03 알고리즘 설계',
  '3-2-1': '프로그래밍 · 01 데이터의 저장과 사용 · 02 다양한 연산',
  '3-2-2': '프로그래밍 · 03 중첩 제어 구조 · 04 함수와 디버깅',
  '3-2-3': '프로그래밍 · 05~06 프로젝트 · 단원 정리',
  '4-1-1': '인공지능의 이해 · 01 인공지능의 개념과 특성 · 02 인공지능 시스템',
  '4-1-2': '인공지능의 이해 · 03 인공지능 시스템과 데이터',
  '4-2-1': '인공지능의 활용 · 01 인공지능 시스템의 적용',
  '4-2-2': '인공지능의 활용 · 02 스마트 교실: 자동 출석부 만들기',
  '4-2-3': '인공지능의 활용 · 03 인공지능의 가치와 윤리 · 단원 정리와 프로젝트',
  '5-1-1': '디지털 사회와 직업 · 01 디지털 사회의 의미와 특성',
  '5-1-2': '디지털 사회와 직업 · 02 디지털 사회와 직업의 변화',
  '5-2-1': '디지털 윤리 · 01 디지털 윤리의 실천',
  '5-2-2': '디지털 윤리 · 02 개인 정보 보호',
  '5-2-3': '디지털 윤리 · 03 저작권 보호 · 단원 정리와 프로젝트',
};

const contentsList = [
  {unit: 1, sub: '1-1-1', icon: '💻', badge: '중1 Ⅰ단원 · 컴퓨팅 시스템', title: '우리 주변의 컴퓨팅 시스템', desc: '생활 속 기기가 컴퓨팅 시스템인지 판별하고, 사회에 미치는 긍정적·부정적 영향을 반 친구들과 모아 봐요. (교과서 11, 14쪽)', href: 'system/1-01-computing-system.html', live: true, std: '01-01', core: true},
  {unit: 1, sub: '1-1-1', icon: '🔩', badge: '중1 Ⅰ단원 · 컴퓨팅 시스템', title: '하드웨어 분류소', desc: '부품을 입력·중앙 처리·기억·출력 장치로 정리하고, 주기억과 보조 기억 장치, 스마트폰 속 하드웨어를 구분해요. (교과서 12, 15쪽)', href: 'system/1-02-hardware.html', std: '01-01', core: true},
  {unit: 1, sub: '1-1-1', icon: '🧱', badge: '중1 Ⅰ단원 · 컴퓨팅 시스템', title: '소프트웨어 분류하기', desc: '시스템 소프트웨어와 응용 소프트웨어를 분류하고, 사용자·소프트웨어·하드웨어의 관계를 쌓아 봐요. (교과서 13~14쪽)', href: 'system/1-03-software.html', std: '01-01', core: true},
  {unit: 1, sub: '1-1-2', icon: '🗺️', badge: '중1 Ⅰ단원 · 컴퓨팅 시스템', title: '입력·처리·출력 따라가기', desc: '길 찾기 앱 속 데이터를 한 단계씩 따라가며 입력 → 처리 → 출력 과정을 확인해요. (교과서 16~17쪽)', href: 'system/1-04-io-process.html', std: '01-01', core: true},
  {unit: 1, sub: '1-1-2', icon: '⚙️', badge: '중1 Ⅰ단원 · 컴퓨팅 시스템', title: '내가 운영체제라면', desc: '램 칸 배정, CPU 순서 정하기, 드라이버 연결로 운영체제의 기능을 체험해요. (교과서 18~21쪽 · 참고: 천재교육 21쪽)', href: 'system/1-05-os.html', std: '01-01', core: true},
  {unit: 1, sub: '1-2-1', icon: '🚪', badge: '중1 Ⅰ단원 · 피지컬 컴퓨팅', title: '피지컬 컴퓨팅과 디지털 도어록', desc: '생활 속 사례로 센서와 액추에이터를 찾고 가장 가치 있는 시스템에 투표하며, 디지털 도어록으로 동작 과정 4단계를 체험해요. (교과서 25~27쪽 · 참고: 천재교육 29쪽)', href: 'system/1-06-physical.html', live: true, std: '01-02', core: true},
  {unit: 1, sub: '1-2-1', icon: '🎛️', badge: '중1 Ⅰ단원 · 피지컬 컴퓨팅', title: '가상 센서 보드', desc: '센서 값(0~1023)을 바꿔 보고 "만약 ~라면" 규칙으로 LED를 제어해요. 엔트리 실습 전 원리 익히기. (교과서 26, 28~31쪽 · 참고: 비상교육 22쪽)', href: 'system/1-07-sensor-board.html', std: '01-02', core: true},
  {unit: 1, sub: '1-2-2', icon: '🏫', badge: '중1 Ⅰ단원 · 피지컬 컴퓨팅', title: '스마트 교실 시뮬레이터', desc: '소리로 켜지는 자동 전등, 시간 신호등, 버튼 신호등을 시뮬레이션으로 확인해요. (교과서 32~36쪽)', href: 'system/1-08-smart-class.html', std: '01-03', core: true},
  {unit: 1, sub: '1-2-2', icon: '📚', badge: '중1 Ⅰ단원 · 창의·융합 프로젝트', title: '쾌적한 도서관 만들기', desc: '소음과 온도 문제를 해결하는 시스템을 입력·처리·출력으로 설계하고 반 전체 설계를 모아 봐요. (교과서 38~39쪽)', href: 'system/1-09-library.html', live: true, std: '01-03', core: true},
  {unit: 1, sub: '1-2-2', icon: '🧭', badge: '중1 Ⅰ단원 · 단원 정리', title: 'Ⅰ단원 정리 퀴즈', desc: '컴퓨팅 시스템과 피지컬 컴퓨팅 핵심 개념을 퀴즈로 정리하고 스스로 점검해요. (교과서 23, 37, 40쪽)', href: 'system/1-10-review.html', std: '01-01~03', core: false},

  {unit: 2, sub: '2-1-1', icon: '🌡️', badge: '중1 Ⅱ단원 · 디지털 표현', title: '아날로그와 디지털', desc: '하루 기온 곡선을 끊어서 나타내 보고, 생활 속 사례를 분류하며 디지털 데이터의 장점을 찾아요. (교과서 44~45, 57쪽)', href: 'data/2-01-analog-digital.html', std: '02-01', core: true},
  {unit: 2, sub: '2-1-1', icon: '💡', badge: '중1 Ⅱ단원 · 디지털 표현', title: '비트와 이진수 카드', desc: '전구와 전기 신호로 비트를 이해하고, 이진수 카드로 0과 1만으로 수를 나타내요. (교과서 46, 48쪽)', href: 'data/2-02-bits.html', std: '02-01', core: true},
  {unit: 2, sub: '2-1-1', icon: '🔤', badge: '중1 Ⅱ단원 · 디지털 표현', title: '문자 코드 암호 해독', desc: '7비트 아스키 코드 암호를 풀고, 내 이니셜과 한글을 문자 코드로 바꾸고, 모둠 릴레이 암호 게임도 해요. (교과서 46쪽 · 참고: 비상교육 85쪽)', href: 'data/2-03-ascii.html', std: '02-01', core: true},
  {unit: 2, sub: '2-1-1', icon: '🎨', badge: '중1 Ⅱ단원 · 디지털 표현', title: '픽셀 그림과 색', desc: '픽셀 그림을 그리고, 색 비트 수와 해상도에 따라 화질과 용량이 어떻게 달라지는지 알아봐요. (교과서 47쪽 · 참고: 씨마스 56~57쪽)', href: 'data/2-04-pixels.html', std: '02-01', core: true},
  {unit: 2, sub: '2-1-1', icon: '🔍', badge: '중1 Ⅱ단원 · 디지털 표현', title: '비트맵과 벡터 확대', desc: '두 그림을 확대해 계단 현상을 비교하고, 파일 형식과 상황에 맞는 방식을 골라요. (교과서 47쪽)', href: 'data/2-05-bitmap-vector.html', std: '02-01', core: true},
  {unit: 2, sub: '2-1-1', icon: '🎵', badge: '중1 Ⅱ단원 · 디지털 표현', title: '소리를 숫자로', desc: '소리 파형을 표본화, 양자화, 부호화하고 직접 들어 보며 음질과 용량을 비교해요. (교과서 48쪽)', href: 'data/2-06-sound.html', std: '02-01', core: true},
  {unit: 2, sub: '2-1-1', icon: '🎞️', badge: '중1 Ⅱ단원 · 디지털 표현', title: '플립북 애니메이션', desc: 'fps를 바꾸며 잔상 효과를 체험하고, 나만의 4프레임 플립북을 만들어 동영상 용량을 계산해요. (교과서 48쪽)', href: 'data/2-07-flipbook.html', std: '02-01', core: true},
  {unit: 2, sub: '2-1-1', icon: '⏱️', lesson: true, badge: '45분 종합 수업', title: '0과 1로 세상 표현하기', desc: '아날로그와 디지털, 비트, 이진수, 픽셀, 문자, 소리를 한 차시에 모두 다루는 수업 페이지예요. (교과서 45~48쪽)', href: '01-binary/', std: '02-01', core: true},
  {unit: 2, sub: '2-1-2', icon: '🕵️', badge: '중1 Ⅱ단원 · 수집과 관리', title: '데이터 수집 탐정', desc: '사건 파일마다 알맞은 수집 방법(설문, 인터뷰, 관찰, 실험, 문헌 조사, 촬영)과 수집 경로를 골라요. (교과서 50~51쪽)', href: 'data/2-08-collect.html', std: '02-02', core: true},
  {unit: 2, sub: '2-1-2', icon: '🔎', badge: '중1 Ⅱ단원 · 수집과 관리', title: '똑똑한 검색과 믿을 만한 출처', desc: '연습용 검색 엔진에서 큰따옴표, 제외(-), 기간, CCL 옵션으로 미션을 해결하고, 믿을 만한 출처를 가려내요. (교과서 51쪽)', href: 'data/2-09-search.html', std: '02-02', core: true},
  {unit: 2, sub: '2-1-2', icon: '🗂️', badge: '중1 Ⅱ단원 · 수집과 관리', title: '데이터 분류 정리함', desc: '같은 파일을 형식과 의미로 분류하고, 스프레드시트 정렬과 메타데이터로 정리하고, 급식 알레르기 음식을 찾아요. (교과서 52~53쪽 · 참고: 씨마스 67쪽)', href: 'data/2-10-classify.html', std: '02-02', core: true},
  {unit: 2, sub: '2-1-2', icon: '☁️', badge: '중1 Ⅱ단원 · 수집과 관리', title: '저장·공유 방법 고르기', desc: '클라우드, 전자 우편, 메신저 등 상황에 맞는 저장·공유 방법을 고르고, 나중에도 찾기 쉬운 파일 이름을 지어요. (교과서 54쪽)', href: 'data/2-11-share.html', std: '02-02', core: true},
  {unit: 2, sub: '2-1-2', icon: '📝', badge: '중1 Ⅱ단원 · 수집과 관리', title: '설문 문항 검사기', desc: '문항 검토 기준으로 잘못된 설문 문항을 찾아 고치고, 나만의 문항을 만들어 가상 응답 비율을 확인해요. (교과서 55쪽)', href: 'data/2-12-survey.html', live: true, std: '02-02', core: true},
  {unit: 2, sub: '2-1-2', icon: '💼', badge: '중1 Ⅱ단원 · 진로 탐색', title: '데이터 직업 탐색', desc: '빅데이터 전문가가 일하는 순서를 맞추고, 데이터 관련 직업과 나에게 맞는 특성을 알아봐요. (교과서 56쪽)', href: 'data/2-13-jobs.html', std: '02-02', core: false},
  {unit: 2, sub: '2-2-1', icon: '🌳', badge: '중1 Ⅱ단원 · 데이터의 구조화', title: '가계도 퍼즐', desc: '말로 된 설명과 가계도로 각각 친척 관계를 맞히며 시간을 재어 보고, 데이터를 구조화하는 이유를 찾아요. (교과서 58~59쪽)', href: 'data/2-14-family.html', std: '02-03', core: true},
  {unit: 2, sub: '2-2-1', icon: '📋', badge: '중1 Ⅱ단원 · 데이터의 구조화', title: '리스트와 테이블', desc: '대기 명단으로 리스트와 인덱스를, 흩어진 메모를 표로 정리하며 행과 열을 익혀요. (교과서 59~60쪽)', href: 'data/2-15-list-table.html', std: '02-03', core: true},
  {unit: 2, sub: '2-2-1', icon: '🕸️', badge: '중1 Ⅱ단원 · 데이터의 구조화', title: '다이어그램: 계층형과 그래프형', desc: '가위바위보 대진표와 폴더 트리, 노선도의 노드와 엣지로 다이어그램을 체험하고 표와 트리를 비교해요. (교과서 61~62쪽 · 참고: 천재교육 66쪽, 씨마스 71쪽)', href: 'data/2-16-diagram.html', std: '02-03', core: true},
  {unit: 2, sub: '2-2-1', icon: '🌹', badge: '중1 Ⅱ단원 · 데이터의 구조화', title: '나이팅게일의 장미 도표', desc: '흩어진 병원 기록을 표와 장미 도표로 바꿔 숨은 원인을 찾고, 데이터로 문제를 해결한 과정을 따라가요. (교과서 63쪽)', href: 'data/2-17-nightingale.html', std: '02-03', core: false},
  {unit: 2, sub: '2-2-2', icon: '🧮', badge: '중1 Ⅱ단원 · 데이터의 해석', title: '데이터 해석과 스프레드시트 수식', desc: '규칙·추세·관계를 찾고, 미니 스프레드시트에 증감·증감률 수식과 AVERAGE, MIN, MAX 함수를 직접 써서 분석해요. (교과서 64~65쪽)', href: 'data/2-18-sheet.html', std: '02-04', core: true},
  {unit: 2, sub: '2-2-2', icon: '📊', badge: '중1 Ⅱ단원 · 데이터의 해석', title: '어떤 차트가 좋을까?', desc: '같은 데이터를 여러 그래프로 바꿔 보고, 버블 차트와 워드 클라우드를 만들며 목적에 맞는 시각화를 골라요. (교과서 66쪽 · 참고: 씨마스 75쪽)', href: 'data/2-19-charts.html', live: true, std: '02-04', core: true},
  {unit: 2, sub: '2-2-2', icon: '📣', badge: '중1 Ⅱ단원 · 데이터의 해석', title: '데이터로 주장하기', desc: '도서관 데이터로 근거 있는 주장을 완성하고, 급식 잔반율 그래프에서 사실과 추측을 구별해요. (교과서 67쪽 · 참고: 비상교육 82쪽)', href: 'data/2-20-claim.html', std: '02-04', core: true},
  {unit: 2, sub: '2-2-3', icon: '💪', badge: '중1 Ⅱ단원 · 프로젝트', title: '우리 반 체력 분석 프로젝트', desc: '줄다리기 우승을 위해 체력 데이터를 정렬·삭제로 정리하고, 신장 구간별 평균으로 분석해 나의 체력과 비교해요. (교과서 68~72쪽)', href: 'data/2-21-fitness.html', std: '02-05', core: true},
  {unit: 2, sub: '2-2-3', icon: '🧭', badge: '중1 Ⅱ단원 · 단원 정리', title: 'Ⅱ단원 미로 탈출 퀴즈', desc: '갈림길마다 맞는 문을 골라 데이터 단원 미로를 탈출하고, 스스로 점검해요. (교과서 73, 76~77쪽)', href: 'data/2-22-maze.html', std: '02-01~05', core: false},
  {unit: 2, sub: '2-2-3', icon: '🗺️', badge: '중1 Ⅱ단원 · 창의·융합 프로젝트', title: '맛집 평점 분석기', desc: '친구들의 맛·가격·양 평가를 모아 평균과 순위를 구하고, 근거를 들어 우리 마을 맛집 지도를 해석해요. (교과서 74~75쪽)', href: 'data/2-23-food-map.html', live: true, std: '02-05', core: false},

  {unit: 3, sub: '3-1-1', icon: '🧭', badge: '중1 Ⅲ단원 · 문제 해결', title: '문제의 상태와 추상화', desc: '초기·현재·목표 상태를 구분하고, 핵심 요소를 골라 추상화한 노선도에서 가장 빠른 길을 찾아요. (교과서 81~84쪽)', href: 'algo/3-01-problem-state.html', std: '03-01, 03-02', core: true},
  {unit: 3, sub: '3-1-1', icon: '🔷', badge: '중1 Ⅲ단원 · 알고리즘', title: '알고리즘을 표현하는 세 가지 방법', desc: '홀짝 판별을 자연어·의사 코드·순서도로 표현하고, 순서도 기호와 알고리즘의 조건을 익혀요. (교과서 85~87쪽)', href: 'algo/3-02-represent.html', std: '03-02', core: true},
  {unit: 3, sub: '3-1-1', icon: '⚖️', badge: '중1 Ⅲ단원 · 알고리즘', title: '양팔 저울로 가벼운 제품 찾기', desc: '저울을 직접 달아 불량품을 찾고, 두 개씩 비교와 세 묶음 비교 알고리즘의 횟수를 비교해요. (교과서 88~89쪽)', href: 'algo/3-03-balance.html', std: '03-03', core: true},
  {unit: 3, sub: '3-1-1', icon: '🔢', badge: '중1 Ⅲ단원 · 알고리즘', title: '숫자 맞히기 업다운 게임', desc: '차례대로 찾기와 반으로 나누어 찾기를 경주시키고, 1~100의 합 알고리즘도 비교해요. (교과서 90~91쪽)', href: 'algo/3-04-up-down.html', std: '03-03', core: true},
  {unit: 3, sub: '3-1-2', icon: '🛒', badge: '중1 Ⅲ단원 · 알고리즘 설계', title: '줄서기 알고리즘 설계', desc: '여러 줄 서기와 한 줄 서기를 시뮬레이션해 모든 손님이 계산을 마치는 시간을 비교해요. (교과서 92~93쪽)', href: 'algo/3-05-queue.html', std: '03-04', core: true},
  {unit: 3, sub: '3-1-2', icon: '👟', badge: '중1 Ⅲ단원 · 알고리즘 설계', title: '신발 찾기: 정렬과 탐색', desc: '뒤죽박죽 진열대와 크기순 진열대에서 신발을 찾으며 정렬과 탐색의 관계를 알아봐요. (교과서 94~95쪽)', href: 'algo/3-06-shoes.html', std: '03-03, 03-04', core: true},
  {unit: 3, sub: '3-1-2', icon: '🗺️', badge: '중1 Ⅲ단원 · 알고리즘 설계', title: '집에서 학교까지 가장 빠른 길', desc: '가장 가까운 곳부터 확정하는 알고리즘을 한 단계씩 실행해 최단 시간 경로를 찾아요. (교과서 96~97쪽)', href: 'algo/3-07-shortest.html', std: '03-04', core: true},
  {unit: 3, sub: '3-1-2', icon: '⛵', badge: '중1 Ⅲ단원 · 알고리즘 설계', title: '강 건너기 퍼즐', desc: '조건을 지키며 농부·개·염소·배추를 최소 횟수로 건너게 하고, 상태를 0과 1로 구조화해요. (교과서 98쪽 · 참고: 비상교육 94~95쪽)', href: 'algo/3-08-river.html', std: '03-01, 03-04', core: false},
  {unit: 3, sub: '3-2-1', icon: '📦', badge: '중1 Ⅲ단원 · 프로그래밍', title: '입출력, 변수와 리스트', desc: '입력과 출력, 변수 상자, 소망 목록 리스트의 추가·수정·삭제, 리스트 끝말잇기를 체험해요. (교과서 101~107쪽)', href: 'algo/3-09-variable-list.html', std: '03-05', core: true},
  {unit: 3, sub: '3-2-1', icon: '🎢', badge: '중1 Ⅲ단원 · 프로그래밍', title: '연산 실험실', desc: '산술·비교·논리 연산 결과를 확인하고, 놀이 기구 탑승 안내 프로그램의 조건을 바꿔 봐요. (교과서 108~110쪽)', href: 'algo/3-10-operators.html', std: '03-06', core: true},
  {unit: 3, sub: '3-2-2', icon: '🌸', badge: '중1 Ⅲ단원 · 프로그래밍', title: '순차·선택·반복과 중첩 제어 구조', desc: '반복 속 반복으로 꽃 모양을 그리고, 반복 속 선택으로 홀수와 짝수를 나눠요. (교과서 112~115쪽)', href: 'algo/3-11-nested.html', std: '03-06', core: true},
  {unit: 3, sub: '3-2-2', icon: '🏠', badge: '중1 Ⅲ단원 · 프로그래밍', title: '함수 만들기와 매개변수', desc: '집 그리기(크기) 함수로 크기가 다른 집을 그리고, 함수를 쓰면 코드가 얼마나 짧아지는지 비교해요. (교과서 118~122, 125쪽)', href: 'algo/3-12-function.html', std: '03-07', core: true},
  {unit: 3, sub: '3-2-2', icon: '🐞', badge: '중1 Ⅲ단원 · 프로그래밍', title: '디버깅 탐정', desc: '디버거처럼 한 단계씩 실행하며 변수 값을 살펴 세 가지 사건의 오류를 찾아 고쳐요. (교과서 124~125쪽)', href: 'algo/3-13-debugging.html', std: '03-07', core: true},
  {unit: 3, sub: '3-2-3', icon: '🗳️', badge: '중1 Ⅲ단원 · 프로젝트', title: '투표 프로그램 프로젝트', desc: '실시간 전자 투표를 체험하고, 추상화·알고리즘 설계·역할 분담으로 투표 프로그램을 계획해요. (교과서 126~138쪽)', href: 'algo/3-14-vote-project.html', live: true, std: '03-08, 03-09', core: true},
  {unit: 3, sub: '3-2-3', icon: '🧭', badge: '중1 Ⅲ단원 · 단원 정리', title: 'Ⅲ단원 정리 퀴즈', desc: '문제 해결·알고리즘·프로그래밍 핵심 개념을 퀴즈로 정리하고 스스로 점검해요. (교과서 99, 139, 142쪽)', href: 'algo/3-15-review.html', std: '03-01~09', core: false},

  {unit: 4, sub: '4-1-1', icon: '🤖', badge: '중1 Ⅳ단원 · 인공지능의 이해', title: '인공지능의 개념과 특성', desc: '내가 경험한 인공지능에 투표하고, 추론·학습·인식·생성 특성과 일반/인공지능 소프트웨어를 구분해요. (교과서 147~151쪽)', href: 'ai/4-01-ai-concept.html', live: true, std: '04-01', core: true},
  {unit: 4, sub: '4-1-1', icon: '🧩', badge: '중1 Ⅳ단원 · 인공지능 시스템', title: '인공지능 모델이 만들어지는 과정', desc: '새와 물고기 분류 모델을 단계별로 만들며 훈련·테스트 데이터와 문제 해결 과정을 익혀요. (교과서 152~155쪽)', href: 'ai/4-02-ai-system.html', std: '04-01', core: true},
  {unit: 4, sub: '4-1-2', icon: '🧪', badge: '중1 Ⅳ단원 · 인공지능과 데이터', title: '좋은 데이터 실험실', desc: '같은 인공지능에 양·품질·특징·대표성이 다른 데이터를 주고 정확도를 비교해요. (교과서 156~159쪽)', href: 'ai/4-03-data-quality.html', std: '04-02', core: true},
  {unit: 4, sub: '4-2-1', icon: '✏️', badge: '중1 Ⅳ단원 · 인공지능의 활용', title: '나만의 이미지 분류 모델', desc: '직접 그린 ⭕✖로 클래스별 데이터를 모으고 학습시켜 새 그림을 분류해요. (교과서 163~167쪽)', href: 'ai/4-04-image-model.html', std: '04-03', core: true},
  {unit: 4, sub: '4-2-1', icon: '🎧', badge: '중1 Ⅳ단원 · 인공지능의 활용', title: '소리 분류 모델', desc: '웃음·박수·휘파람 소리의 특징을 학습시켜 처음 듣는 소리를 분류해요. (교과서 163, 168쪽 · 참고: 비상교육 186~188쪽)', href: 'ai/4-05-sound-model.html', std: '04-03', core: true},
  {unit: 4, sub: '4-2-1', icon: '💬', badge: '중1 Ⅳ단원 · 인공지능의 활용', title: '텍스트 분류 모델: 감정과 스팸', desc: '문장으로 감정·스팸 분류 모델을 학습시키고 테스트 문장으로 정확도를 평가해요. (교과서 169~171쪽)', href: 'ai/4-06-text-model.html', std: '04-03', core: true},
  {unit: 4, sub: '4-2-2', icon: '📸', badge: '중1 Ⅳ단원 · 인공지능의 활용', title: '자동 출석부 설계하기', desc: '문제 정의, 개인 정보를 고려한 데이터 수집, 동작 순서를 설계하고 시뮬레이션해요. (교과서 172~175쪽)', href: 'ai/4-07-attendance.html', std: '04-04', core: false},
  {unit: 4, sub: '4-2-2', icon: '🏪', badge: '중1 Ⅳ단원 · 인공지능의 활용', title: '인공지능으로 해결할 문제 찾기', desc: '문제에 맞는 인공지능 기술을 고르고, 편의점 인공지능 아이디어를 반 친구들과 모아요. (교과서 176~177쪽)', href: 'ai/4-08-ai-problems.html', live: true, std: '04-04', core: true},
  {unit: 4, sub: '4-2-3', icon: '⚖️', badge: '중1 Ⅳ단원 · 인공지능 윤리', title: '인공지능의 가치와 윤리', desc: '사회적 역할과 다섯 가지 고려 사항을 알고, 데이터 편향 사례와 책임 문제를 근거를 들어 토론해요. (교과서 178~182쪽)', href: 'ai/4-09-ai-ethics.html', live: true, std: '04-05', core: true},
  {unit: 4, sub: '4-2-3', icon: '💡', badge: '중1 Ⅳ단원 · 창의·융합 프로젝트', title: '사람을 위한 착한 인공지능', desc: '디자인 싱킹 5단계로 사회 문제를 해결하는 인공지능을 기획하고 모둠 기획을 모아 봐요. (교과서 184~185쪽)', href: 'ai/4-10-design-thinking.html', live: true, std: '04-04, 04-05', core: true},
  {unit: 4, sub: '4-2-3', icon: '🧭', badge: '중1 Ⅳ단원 · 단원 정리', title: 'Ⅳ단원 정리 퀴즈', desc: '모델 개발 과정 채우기와 퀴즈로 인공지능 단원을 정리하고 스스로 점검해요. (교과서 161, 183, 186쪽)', href: 'ai/4-11-review.html', std: '04-01~05', core: false},

  {unit: 5, sub: '5-1-1', icon: '🏙️', badge: '중1 Ⅴ단원 · 디지털 사회', title: '디지털 사회와 스마트 시티', desc: '디지털 사회의 네 가지 모습을 찾고, 스마트 시티 속 디지털 기술을 살펴보며 정보 격차를 줄이는 방법을 알아봐요. (교과서 191~194쪽)', href: 'culture/5-01-digital-society.html', std: '05-01', core: true},
  {unit: 5, sub: '5-1-1', icon: '🛠️', badge: '중1 Ⅴ단원 · 디지털 사회', title: '디지털 기술로 사회 문제 해결하기', desc: '분야별 문제에 어울리는 기술을 고르고, 모둠 해결안 보드를 만들어 발표해요. (교과서 195쪽)', href: 'culture/5-02-solve.html', live: true, std: '05-01', core: false},
  {unit: 5, sub: '5-1-2', icon: '🚀', badge: '중1 Ⅴ단원 · 진로 탐색', title: '디지털 사회와 직업의 변화', desc: '사라지는 직업과 새로 생기는 직업을 분류하고, 변화하는 직업의 과거와 현재를 비교하며 나의 진로를 설계해요. (교과서 196~200쪽)', href: 'culture/5-03-jobs.html', live: true, std: '05-01', core: true},
  {unit: 5, sub: '5-2-1', icon: '🚦', badge: '중1 Ⅴ단원 · 디지털 윤리', title: '디지털 윤리 상황판', desc: '상황마다 디지털 윤리를 지키는 행동을 고르고, 우리 반의 디지털 생활 약속을 만들어요. (교과서 203, 208쪽)', href: 'culture/5-04-ethics.html', live: true, std: '05-02', core: true},
  {unit: 5, sub: '5-2-1', icon: '🛑', badge: '중1 Ⅴ단원 · 디지털 윤리', title: '사이버 폭력 멈춰!', desc: '가상 단체 대화방에서 사이버 폭력을 찾아내고, 유형을 분류하며 목격했을 때의 대처법을 익혀요. (교과서 204쪽)', href: 'culture/5-05-cyber-violence.html', std: '05-02', core: true},
  {unit: 5, sub: '5-2-1', icon: '🎣', badge: '중1 Ⅴ단원 · 디지털 윤리', title: '사이버 범죄 예방 훈련', desc: '사이버 범죄의 유형을 분류하고, 가상 피싱 문자에서 수상한 부분을 찾아 예방 수칙을 익혀요. (교과서 205쪽)', href: 'culture/5-06-cyber-crime.html', std: '05-02', core: true},
  {unit: 5, sub: '5-2-1', icon: '⏰', badge: '중1 Ⅴ단원 · 디지털 윤리', title: '사이버 중독 예방하기', desc: '스마트폰·인터넷 중독과 게임 과몰입 증상을 구별하고, 개인과 사회의 예방 노력을 찾으며 나의 습관을 점검해요. (교과서 206~209쪽)', href: 'culture/5-07-addiction.html', std: '05-02', core: true},
  {unit: 5, sub: '5-2-2', icon: '🕵️', badge: '중1 Ⅴ단원 · 개인 정보 보호', title: '개인 정보 탐정', desc: '단서를 합치면 한 사람이 드러나는 것을 체험하고, 개인 정보 유형을 분류하며 게시물 속 개인 정보를 가려요. (교과서 210~211, 213쪽)', href: 'culture/5-08-privacy.html', std: '05-03', core: true},
  {unit: 5, sub: '5-2-2', icon: '🔐', badge: '중1 Ⅴ단원 · 개인 정보 보호', title: '안전한 비밀번호 실험실', desc: '연습용 비밀번호의 강도를 측정하고, 개인 정보를 지키는 보안 습관을 익혀요. 입력값은 저장하지 않아요. (교과서 212쪽)', href: 'culture/5-09-password.html', std: '05-03', core: true},
  {unit: 5, sub: '5-2-3', icon: '⚖️', badge: '중1 Ⅴ단원 · 저작권 보호', title: '저작권 판정소', desc: '저작 인격권과 저작 재산권을 구분하고, 보호 기간 계산과 저작물 이용 5단계를 익혀 침해 여부를 판정해요. (교과서 214, 216~218쪽)', href: 'culture/5-10-copyright.html', std: '05-03', core: true},
  {unit: 5, sub: '5-2-3', icon: '🎛️', badge: '중1 Ⅴ단원 · 저작권 보호', title: '디지털 저작물과 CCL 조합기', desc: '소프트웨어 사용 범위와 공공누리 유형을 알아보고, CCL 조건을 조합해 이용할 수 있는 범위를 확인해요. (교과서 215쪽)', href: 'culture/5-11-license.html', std: '05-03', core: true},
  {unit: 5, sub: '5-2-3', icon: '🧩', badge: '중1 Ⅴ단원 · 단원 정리', title: 'Ⅴ단원 용어 퍼즐', desc: '설명과 초성 힌트로 디지털 문화 단원의 핵심 용어를 맞히고 스스로 점검해요. (교과서 219, 222쪽)', href: 'culture/5-12-puzzle.html', std: '05-01~03', core: false},
  {unit: 5, sub: '5-2-3', icon: '📰', badge: '중1 Ⅴ단원 · 창의·융합 프로젝트', title: '카드 뉴스 기획실', desc: '디지털 윤리 주제를 골라 사례를 정리하고, 3장짜리 카드 뉴스 개요를 미리 보기로 만들어 봐요. (교과서 220~221쪽)', href: 'culture/5-13-card-news.html', live: true, std: '05-02, 05-03', core: false},
];

/* 학생 로그인(학번 + 개인 코드) 켜기. false면 지금처럼 로그인 없이 누구나 체험할 수 있다.
   true로 바꾸면 로그인한 학생만, 선생님이 연 활동만 할 수 있고 진도·출석이 기록된다(assets/auth.js).
   켜기 전에 미리 보려면 주소 끝에 ?login 을 붙인다(그 탭에서만 켜짐). */
const LOGIN_ON = false;
function loginActive(){
  if (LOGIN_ON) return true;
  try {
    if (/[?&](login|emu)\b/.test(location.search)) sessionStorage.setItem('ga:try', '1');
    return sessionStorage.getItem('ga:try') === '1';
  } catch (e){ return false; }
}
