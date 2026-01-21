// ================================================================
// 1. 전역 변수 & 설정
// ================================================================
const API_BASE = "http://localhost:8080/api";
const $root = document.getElementById('app-root');
let currentUser = null;
let currentWeatherInfo = "날씨 정보 없음";
let globalData = {
    clothes: [],
    logs: [],
    feed: [],
    notifications: []
};

// 기록용 변수
let targetDate = null;
let selectedOotdIds = [];
let selectedBaseItemId = null;
let currentEditId = null;

// ================================================================
// 2. 초기화 & 로그인 로직
// ================================================================

window.addEventListener('DOMContentLoaded', () => {
    // LA 웹 스토리지를 활용한 데이터 저장 및 수정 기능
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('login-modal').style.display = 'none';
        loadServerData();
    } else {
        document.getElementById('login-modal').style.display = 'flex';
    }

    if (!location.hash) location.hash = "#home";
    handleRouting();
});

async function handleLogin() {
    const idInput = document.getElementById('login-id').value;
    const pwInput = document.getElementById('login-pw').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: idInput, password: pwInput })
        });

        if (response.ok) {
            const text = await response.text();
            if (!text) { alert("아이디 또는 비밀번호가 일치하지 않습니다."); return; }
        // LA 웹 스토리지를 활용한 데이터 저장 및 수정 기능
            const member = JSON.parse(text);
            if (member) {
                currentUser = member;
                localStorage.setItem('user', JSON.stringify(member));
                alert(`${member.nickname}님 환영합니다!`);
                document.getElementById('login-modal').style.display = 'none';
                loadServerData();
                renderHome();
            }
        } else {
            alert("로그인 실패");
        }
    } catch (error) {
        console.error("로그인 에러:", error);
        alert("서버 연결 실패");
    }
}

function logout() {
    localStorage.removeItem('user');
    location.reload();
}

// ================================================================
// 3. 데이터 로딩 (서버 -> 프론트)
// ================================================================
async function loadServerData() {
    if (!currentUser) return;

    try {
        // (1) 내 옷장 가져오기
        const closetRes = await fetch(`${API_BASE}/closet/${currentUser.id}`);
        const closetData = await closetRes.json();

        // (2) 내 기록 가져오기
        const logRes = await fetch(`${API_BASE}/log/${currentUser.id}`);
        const logData = await logRes.json();

        // (3) 홈 화면용 '전체 공개 피드' 가져오기!
        const feedRes = await fetch(`${API_BASE}/log/feed?myId=${currentUser.id}`);
        const feedData = await feedRes.json();

        // 데이터 매핑
        globalData.clothes = closetData.map(c => ({
            id: c.id, category: c.category, img: c.imageUrl, name: c.name, color: c.color
        }));

        // 내 로그 매핑
        globalData.logs = mapLogs(logData);

        // 공개 피드 매핑
        globalData.feed = mapLogs(feedData);

        console.log("데이터 로드 완료:", globalData);
        handleRouting();

    } catch (error) {
        console.error("데이터 로딩 실패:", error);
    }
}
// 로그 데이터를 우리가 쓰는 포맷으로 변환
function mapLogs(serverLogs) {
    return serverLogs.map(l => {
        let icons = [];
        if (l.clothesIds && l.clothesIds.length > 0) {
            icons = l.clothesIds.map(id => {
                const item = globalData.clothes.find(c => Number(c.id) === Number(id));
                return item ? getCategoryIcon(item.category) : '👕';
            });
        } else {
            icons = ["👕"];
        }

        return {
            id: l.id,
            dateStr: l.date,
            type: l.type,
            isPublic: l.public,
            img: l.imageUrl,
            comment: l.comment,
            clothesIds: l.clothesIds || [],
            likeCount: l.likeCount, // 좋아요 카운트 추가
            isLiked: l.isLiked,     // 좋아요 여부 추가

            // DTO가 제공하는 작성자 정보를 직접 사용
            memberId: l.memberId,
            nickname: l.nickname,
            profileImg: l.profileImg,

            icons: icons
        };
    });
}

// ================================================================
// 4. 라우터 & 화면 렌더링
// ================================================================
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    const hash = location.hash.replace('#', '');
    updateActiveNav(hash);

    switch (hash) {
        case 'home': renderHome(); break;
        case 'closet': renderCloset(); break;
        case 'calendar': renderCalendar(); break;
        case 'notify': renderNotify(); break;
        case 'mypage': renderMypage(); break;
        default: renderHome();
    }
    window.scrollTo(0, 0);
}

function updateActiveNav(hash) {
    const targetHref = `#${hash}`;
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    const activeLinks = document.querySelectorAll(`a[href="${targetHref}"]`);
    activeLinks.forEach(link => link.classList.add('active'));
}

// --- 홈 화면 ---
function renderHome() {
    const publicFeeds = globalData.feed;
    const weatherWidgetHtml = `
        <div class="weather-widget-card" style="margin-bottom: 20px; padding: 20px; border-radius: 16px; background: linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%); color: #555; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div class="weather-text-info">
                <h3 style="margin: 0; font-size: 16px; opacity: 0.8; color: #333;">Today's Weather</h3>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                    <span id="weather-temp-display" style="font-size: 32px; font-weight: bold; color: #333;">--°C</span>
                    <span id="weather-icon-display" style="font-size: 32px;">🌤️</span>
                </div>
                <p id="weather-comment-display" style="margin: 5px 0 0; font-size: 13px; color: #666;">위치 정보를 불러오는 중...</p>
            </div>
        </div>
    `;
    $root.innerHTML = `
        ${weatherWidgetHtml} <div class="gallery-grid">
            ${publicFeeds.length > 0 ? publicFeeds.map(feed => `
                <div class="gallery-item">
                    <img src="${feed.img}" alt="OOTD" ondblclick="toggleLike(${feed.id})">
                    <div class="item-overlay">
                        
                        <div class="overlay-user" onclick="openUserProfile(${feed.memberId})"> 
                            <img src="${feed.profileImg}" style="width:24px; height:24px; border-radius:50%; margin-right:6px; vertical-align:middle; border:1px solid #fff;">
                            <span>${feed.nickname}</span>
                        </div>

                        <div class="overlay-stats">
                            <button onclick="toggleLike(${feed.id})" style="margin-right:5px;">
                                <i class="${feed.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                                <span class="like-count">${feed.likeCount || 0}</span>
                            </button>
                            <span class="overlay-tag">${feed.dateStr}</span>
                        </div>
                    </div>
                </div>
            `).join('') : '<p class="no-data-msg">아직 공유된 게시물이 없어요.</p>'}
        </div>
        <div style="height: 80px;"></div>
    `;

    //  화면 다 그리고 나서 날씨 데이터 가져오기 실행!
    fetchWeather();
}

// 좋아요 API 호출 함수
async function toggleLike(logId) {
    if(!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/social/like`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ memberId: currentUser.id, logId: logId })
        });
        if(res.ok) {
            // 1. 서버의 응답 (isLiked, likeCount)을 받습니다.
            const newStatus = await res.json();

            // 2. globalData.feed에서 해당 로그를 찾습니다.
            const logToUpdate = globalData.feed.find(feed => Number(feed.id) === Number(logId));

            if(logToUpdate) {
                // 3. 전역 상태를 API 응답 값으로 직접 갱신합니다.
                logToUpdate.isLiked = newStatus.isLiked;
                logToUpdate.likeCount = newStatus.likeCount;
            }

            // 4. 데이터 로드 없이 현재 화면만 다시 렌더링합니다. (즉각 반영)
            if(location.hash === '#home' || location.hash === '') renderHome();

            // 만약 캘린더 화면이었다면 캘린더도 다시 렌더링해야 할 수 있습니다.
        }
    } catch(e) { console.error(e); }
}

// ---내 옷장 ---
function renderCloset() {
    $root.innerHTML = `
        <div class="closet-header">
            <div class="user-profile-mini">
                <img src="${currentUser ? currentUser.profileImg : ''}" alt="Profile" onerror="this.src='https://placehold.co/100'">
            </div>
            <div class="closet-stats">
                <h2>${currentUser ? currentUser.nickname : 'Guest'}님의 옷장</h2>
                <p>총 <b>${globalData.clothes.length}</b>벌</p>
            </div>
        </div>
        <button class="ai-hero-btn" onclick="openAiModal()">
            <div class="btn-content">
                <span class="icon">🤖</span>
                <div class="text-group"><strong class="title">AI 코디 추천 받기</strong><span class="desc">오늘 뭐 입지? 고민될 땐!</span></div>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </button>
        <div class="closet-filter-bar">
            <button class="filter-chip active" onclick="renderClosetItems('all', this)">전체</button>
            <button class="filter-chip" onclick="renderClosetItems('아우터', this)">🧥 아우터</button>
            <button class="filter-chip" onclick="renderClosetItems('상의', this)">👕 상의</button>
            <button class="filter-chip" onclick="renderClosetItems('하의', this)">👖 하의</button>
            <button class="filter-chip" onclick="renderClosetItems('신발', this)">👟 신발</button>
            <button class="filter-chip" onclick="renderClosetItems('목도리', this)">🧣 목도리</button>
            <button class="filter-chip" onclick="renderClosetItems('악세서리', this)">💍 악세서리</button>
        </div>
        <div class="closet-grid" id="closet-list-area"></div>
        <div style="height: 80px;"></div>
    `;
    renderClosetItems('all');
}

function renderClosetItems(filterCat, btnElement) {
    if(btnElement) {
        document.querySelectorAll('.closet-filter-bar .filter-chip').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const container = document.getElementById('closet-list-area');
    const items = filterCat === 'all' ? globalData.clothes : globalData.clothes.filter(c => c.category === filterCat);

    container.innerHTML = items.map(item => `
        <div class="closet-item" onclick="openClothesDetail(${item.id})">
            <img src="${item.img}" alt="${item.name}">
            <span class="category-badge">${item.category}</span>
        </div>
    `).join('') + `
        <div class="closet-item add-item-box" onclick="toggleModal('add-clothes-modal', true)">
            <i class="fa-solid fa-plus"></i><span>새 옷 등록</span>
        </div>
    `;
}

// --- 캘린더 ---
function renderCalendar() {
    let gridHtml = '';
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const startDay = new Date(currentYear, currentMonth - 1, 1).getDay();

    for(let i=0; i<startDay; i++) gridHtml += `<div class="day-cell empty"></div>`;

    for(let day=1; day<=daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayLogs = globalData.logs.filter(l => l.dateStr === dateStr);

        let content = `<span class="day-num">${day}</span>`;
        let cls = 'day-cell';

        if(dayLogs.length > 0) {
            cls += ' has-record';
            const photoLog = dayLogs.find(l => l.type === 'PHOTO');

            if(photoLog) {
                cls += ' photo-type';
                content += `<img src="${photoLog.img}" class="day-bg-img">`;
                if(dayLogs.length > 1) content += `<span class="multi-badge">+${dayLogs.length-1}</span>`;
            } else {
                cls += ' icon-type';
                content += `<div class="mini-icons">`;
                const allIcons = dayLogs.flatMap(l => l.icons || []);
                const uniqueIcons = [...new Set(allIcons)].slice(0, 2);
                uniqueIcons.forEach(ic => content += `<span>${ic}</span>`);
                content += `</div>`;
            }
        }
        gridHtml += `<div class="${cls}" onclick="openDateDetail('${dateStr}')">${content}</div>`;
    }

    $root.innerHTML = `
        <div class="calendar-header"><h2>${currentYear}.${currentMonth}</h2></div>
        <div class="weekday-header"><span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span></div>
        <div class="calendar-grid">${gridHtml}</div>
        <div style="height: 80px;"></div>
    `;
}

// --- 🔔 알림 ---

async function renderNotify() {
    try {
        const res = await fetch(`${API_BASE}/social/notifications/${currentUser.id}`);
        const notis = await res.json();

        const listHtml = notis.length > 0 ? notis.map(n => {
            let actionBtn = '';

            // 팔로우 요청일 때만 수락/거절 버튼 표시
            if (n.type === 'FOLLOW_REQUEST') {
                actionBtn = `
                    <div class="noti-actions">
                        <button class="accept-btn" onclick="respondFollow(${n.id}, true)">수락</button>
                        <button class="reject-btn" onclick="respondFollow(${n.id}, false)">거절</button>
                    </div>
                `;
            }

            // 아이콘 및 메시지 설정
            let iconClass = 'fa-solid fa-bell';
            let iconColor = '#8D6E63'; // 기본값
            if(n.type === 'LIKE') { iconClass = 'fa-solid fa-heart'; iconColor = '#E57373'; }
            if(n.type === 'NEW_POST') { iconClass = 'fa-solid fa-image'; iconColor = '#FFB74D'; }
            if(n.type === 'FOLLOW_REQUEST') { iconClass = 'fa-solid fa-user-plus'; iconColor = '#64B5F6'; }

            return `
                <div class="notify-item">
                    <div class="noti-profile">
                        <img src="${n.sender.profileImg}" onerror="this.src='https://placehold.co/50'">
                        <div class="noti-icon-badge" style="background:${iconColor}"><i class="${iconClass}" style="font-size:10px;"></i></div>
                    </div>
                    <div class="noti-content">
                        <span class="actor-name">${n.sender.nickname}</span> ${n.message}
                        <span class="noti-time">${new Date(n.createdAt).toLocaleDateString()}</span>
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('') : '<p class="no-data">새로운 알림이 없습니다.</p>';

        $root.innerHTML = `<div class="notify-header"><h2>알림</h2></div><div class="notify-list">${listHtml}</div><div style="height:80px"></div>`;

    } catch(e) { console.error(e); }
}

// 팔로우 응답 함수
async function respondFollow(notiId, accept) {
    try {
        const res = await fetch(`${API_BASE}/social/respond`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ notificationId: notiId, accept: accept })
        });
        if(res.ok) {
            renderNotify(); // 목록 갱신
            alert(accept ? "Ref 요청을 수락했습니다! 🎉" : "거절했습니다.");
        }
    } catch(e) { console.error(e); }
}
async function renderMypage() {
    if (!currentUser) return;

    // 1. 내 OOTD 목록 가져오기
    const myFeeds = globalData.logs.filter(log => log.type === 'PHOTO');

    //  팔레트 데이터 계산
    const paletteData = calculateClosetPalette(globalData.clothes);

    // 2. 서버에서 '진짜' 팔로워/팔로잉 숫자 가져오기
    let realMates = 0;
    let realRefs = 0;

    try {
        // 소셜 프로필 조회 API 활용
        const res = await fetch(`${API_BASE}/social/profile/${currentUser.id}?myId=${currentUser.id}`);
        if (res.ok) {
            const data = await res.json();
            realMates = data.matesCount;
            realRefs = data.refsCount;
            if (data.member) {
                currentUser.nickname = data.member.nickname;       // 닉네임 갱신
                currentUser.profileImg = data.member.profileImg;   // 프로필 사진 갱신
                currentUser.styleTags = data.member.styleTags;     // 스타일 태그 갱신
            }
            // 로컬 스토리지 정보 최신화

            currentUser.matesCount = realMates;
            currentUser.refsCount = realRefs;
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
    } catch (e) {
        console.error("프로필 정보 로딩 실패", e);
    }

    // 3. 화면 그리기
    const styles = currentUser.styleTags ? currentUser.styleTags.split(',') : ['CASUAL'];
    const mainStyle = styles[0];
    const bioMap = {
        'MINIMAL': "심플함이 곧 베스트. 군더더기 없는 깔끔한 룩을 지향합니다. ☕️",
        'CASUAL': "편안함과 스타일을 동시에. 데일리하게 입기 좋은 룩을 좋아해요. 🧢",
        'STREET': "힙하고 자유로운 무드. 남들과는 다른 개성을 중요하게 생각해요. 🛹",
        'VINTAGE': "시간이 지나도 변하지 않는 멋. 빈티지한 감성을 사랑합니다. 🎞️",
        'LOVELY': "사랑스럽고 포근한 분위기. 밝은 컬러와 부드러운 실루엣을 선호해요. 🌸",
        'SPORTY': "활동적이고 에너제틱하게! 스포티한 애슬레저 룩을 즐겨 입어요. 👟"
    };
    const userBio = bioMap[mainStyle] || "나만의 스타일을 찾아가는 중입니다. ✨";
    const styleBadges = styles.map(s => `<span>#${getStyleName(s)}</span>`).join('');

    // 날짜 포맷팅
    const getTodayString = () => {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yy}.${mm}.${dd}`;
    }

    $root.innerHTML = `
        <div class="style-profile-card">
            <div class="profile-row-top">
                <div class="profile-text-info">
                    <h2 class="user-nickname">${currentUser.nickname}</h2>
                    
                    <div class="profile-social-stats">
                        <div class="stat-group"><span class="stat-num">${realMates}</span><span class="stat-label">Mates</span></div>
                        <div class="divider"></div>
                        <div class="stat-group"><span class="stat-num">${realRefs}</span><span class="stat-label">Refs</span></div>
                    </div>
                    
                    <p class="user-bio">${userBio}</p>
                    <div class="style-keywords">${styleBadges}</div>
                </div>
                <div class="profile-img-box">
                    <img src="${currentUser.profileImg || ''}" alt="Profile" onerror="this.src='https://placehold.co/100'">
                </div>
            </div>
            
            <div class="closet-analytics">
                <span class="label">My Closet Palette</span>
                <div class="color-bar-container">${paletteData.html}</div>
                <p class="anal-text">${paletteData.text}</p>
            </div>
            <button class="edit-profile-btn" onclick="toggleModal('edit-profile-modal', true)">정보 수정 / 로그아웃</button>
        </div>

        <div class="mypage-tabs">
            <button class="mp-tab active">내 OOTD <b>${myFeeds.length}</b></button>
            <button class="mp-tab">스크랩</button>
        </div>

        <div class="profile-grid">
            ${myFeeds.map(feed => {
        let displayDate = getTodayString();
        if (feed.dateStr) {
            const parts = feed.dateStr.split('-');
            if(parts.length === 3) displayDate = `${parts[0].slice(-2)}.${parts[1]}.${parts[2]}`;
            else displayDate = feed.dateStr;
        }
        return `
                    <div class="profile-grid-item">
                        <img src="${feed.img}">
                        <span class="feed-date-badge">${displayDate}</span>
                    </div>
                `;
    }).join('')}
            

        </div>
        
        <div style="height: 100px;"></div>
    `;
}
// ================================================================
// 5. 모달 & 기능 함수
// ================================================================

function toggleModal(id, show) {
    const el = document.getElementById(id);
    if(el) el.style.display = show ? 'flex' : 'none';
}
// 이미지 미리보기 함수
function previewImage(input) {
    if (input.files && input.files[0]) {
        compressImage(input.files[0]).then(base64 => {
            const img = document.getElementById('preview-img');
            img.src = base64;
            img.style.display = 'block';
            document.getElementById('upload-placeholder').style.display = 'none';
        });
    }
}
// 이미지 압축해주는 함수
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const maxSize = 800;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                } else {
                    if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}
// 옷 등록 함수
function registerClothes() {
    const fileInput = document.getElementById('clothes-file-input');
    const categoryInput = document.getElementById('clothes-category-input');
    const nameInput = document.getElementById('clothes-name-input');

    // 1. 파일 검사
    if (!fileInput.files[0]) {
        alert("사진을 선택해주세요!");
        return;
    }

    // 2. 이미지를 Base64 문자열로 변환 (FileReader 사용)
    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);

    reader.onload = function() {
        const base64Image = reader.result; // "data:image/jpeg;base64,..." 형태

        // 3. 사용자 정보 가져오기
        // Session을 이용한 데이터 저장 및 수정 기능
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.userId) {
            alert("로그인이 필요합니다.");
            return;
        }

        // 4. 데이터 준비 (Java Controller가 기다리는 JSON 형태)
        const payload = {
            memberId: user.id,          // Java: payload.get("memberId")
            imageUrl: base64Image,      // Java: payload.get("imageUrl")
            category: categoryInput.value,
            name: nameInput.value,
            color: ""                   // 색상은 비워보냄 -> Java가 AI 돌려서 채움
        };

        // 5. 서버 전송 (JSON 방식)
        //Ajax를 활용한 데이터 저장/삭제/수정 기능 - 데이터 저장 (POST)
        fetch('/api/closet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("서버 오류");
                }
            })
            .then(data => {
                alert("옷이 등록되었습니다!");
                location.reload();
            })
            .catch(error => {
                console.error(error);
                alert("등록 실패: " + error.message);
            });
    };

    reader.onerror = function(error) {
        console.log('Error: ', error);
        alert("이미지 읽기 실패");
    };
}
// 등록된 옷 클릭했을 때
function openClothesDetail(id) {
    const item = globalData.clothes.find(c => c.id === id);
    if (!item) return;
    currentEditId = id;
    document.getElementById('detail-img').src = item.img;
    document.getElementById('detail-category-input').value = item.category;
    toggleModal('clothes-detail-modal', true);
}
// LA - Ajax를 활용한 데이터 저장/삭제/수정 기능 -> 데이터 수정
async function updateClothes() {
    const newCategory = document.getElementById('detail-category-input').value;
    try {
        const res = await fetch(`${API_BASE}/closet/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: newCategory })
        });
        if (res.ok) { alert("수정됨"); toggleModal('clothes-detail-modal', false); loadServerData(); }
    } catch (e) { console.error(e); }
}
// LA - Ajax를 활용한 데이터 저장/삭제/수정 기능 - 데이터 삭제
async function deleteClothes() {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
        const res = await fetch(`${API_BASE}/closet/${currentEditId}`, { method: 'DELETE' });
        if (res.ok) { alert("삭제됨"); toggleModal('clothes-detail-modal', false); loadServerData(); }
    } catch (e) { console.error(e); }
}

// AI 모달
function openAiModal() {
    selectedBaseItemId = null;
    selectedBaseItemIds = [];
    renderAiModalItems('all');
    document.getElementById('ai-prompt-input').value = "";
    toggleModal('ai-recommend-modal', true);
}

function renderAiModalItems(cat) {
    const container = document.getElementById('ai-closet-grid');
    if(!container) return;
    const items = cat === 'all' ? globalData.clothes : globalData.clothes.filter(c => c.category === cat);

    container.innerHTML = items.map(item => `
        <div class="modal-closet-item ${selectedBaseItemIds.includes(item.id) ? 'selected' : ''}" onclick="toggleAiBaseItem(${item.id})">
            <img src="${item.img}">
            <div class="check-overlay"><i class="fa-solid fa-check"></i></div>
        </div>
    `).join('');
}
function toggleAiBaseItem(id) {
    // 1. 선택/해제 로직
    if (selectedBaseItemIds.includes(id)) {
        selectedBaseItemIds = selectedBaseItemIds.filter(i => i !== id);
    } else {
        selectedBaseItemIds.push(id);
    }

    // 2. 현재 활성화된 탭 찾기
    const activeTabEl = document.querySelector('#ai-recommend-modal .active');

    // 3. 만약 .active 요소를 못 찾으면(null이면) 'all'을 기본값으로 사용
    const activeCat = activeTabEl ? activeTabEl.dataset.cat : 'all';

    // 4. 렌더링 실행
    renderAiModalItems(activeCat);
}

function filterAiItems(cat, btn) {
    document.querySelectorAll('#ai-recommend-modal .modal-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAiModalItems(cat);
}

async function requestAiRecommendation() {
    const promptText = document.getElementById('ai-prompt-input').value;
    const btn = document.getElementById('btn-request-ai');
    btn.innerText = "AI 생각중..."; btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/ai/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberId: currentUser.id,
                clothesIds: selectedBaseItemIds,
                userPrompt: promptText,
                weather: currentWeatherInfo
            })
        });
        if (response.ok) {
            const result = await response.json();
            showAiResult(result);
        } else {
            alert("연결 실패");
        }
    } catch (e) { console.error(e); }
    finally { btn.innerText = "AI에게 추천받기 ✨"; btn.disabled = false; }
}

function showAiResult(data) {
    toggleModal('ai-recommend-modal', false);
    const body = document.querySelector('#ai-result-modal .bottom-sheet');

    let itemsHtml = '';
    if (data.recommendedItems) {
        itemsHtml = data.recommendedItems.map(item => `
            <div style="display:flex; flex-direction:column; align-items:center; width:80px;">
                <img src="${item.imageUrl}" style="width:70px; height:70px; border-radius:10px; object-fit:contain; border:1px solid #eee; background-color: #f9f9f9;">
                <span style="font-size:11px; margin-top:5px;">${item.name}</span>
            </div>
        `).join('');
    }

    body.innerHTML = `
        <div class="modal-header"><h3>AI's Pick ✨</h3><button class="close-icon" onclick="toggleModal('ai-result-modal', false)">&times;</button></div>
        <div style="text-align: center; padding: 10px 0;">
            <h2 style="font-size: 20px; color: #3E2723; margin-bottom: 10px;">${data.title}</h2>
            <p style="font-size: 14px; color: #5D4037; background: #F5F1ED; padding: 15px; border-radius: 12px; margin-bottom:20px;">${data.reason}</p>
            <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">${itemsHtml}</div>
        </div>
        <button class="sidebar-record-btn" onclick="toggleModal('ai-result-modal', false)">좋아요! 🥰</button>
    `;
    toggleModal('ai-result-modal', true);
}

// 기록 저장
function openRecordModal(dateStr) {
    if (!dateStr) targetDate = new Date().toISOString().split('T')[0];
    else targetDate = dateStr;
    const modalTitle = document.querySelector('#record-modal h3');
    if(modalTitle) modalTitle.innerText = `${targetDate} 기록`;
    toggleModal('record-modal', true);
}

function savePhotoRecord() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            compressImage(file).then(base64 => {
                const comment = prompt("한마디 남겨주세요!");
                if (comment) {
                    sendLogToServer({
                        memberId: currentUser.id, date: targetDate,
                        type: "PHOTO", isPublic: true, imageUrl: base64,
                        comment: comment, clothesIds: []
                    });
                }
            });
        }
    };
    input.click();
}

// 옷 선택 모달 열 때 초기화 확실히
function openManualClosetModal() {
    toggleModal('record-modal', false);
    toggleModal('manual-record-modal', true);

    // 초기화: 선택된 옷 배열 비우고 탭을 '전체'로 리셋
    selectedOotdIds = [];
    const allTab = document.querySelector('#manual-record-modal .filter-chip[data-cat="all"]');
    if(allTab) filterManualItems('all', allTab); // 탭도 '전체'로 시각적 변경
    else renderManualItems('all');
}

function renderManualItems(cat) {
    const container = document.getElementById('manual-closet-grid');
    const items = cat === 'all' ? globalData.clothes : globalData.clothes.filter(c => c.category === cat);
    container.innerHTML = items.map(item => `
        <div class="modal-closet-item ${selectedOotdIds.includes(item.id) ? 'selected' : ''}" onclick="toggleManualItem(${item.id})">
            <img src="${item.img}">
            <div class="check-overlay"><i class="fa-solid fa-check"></i></div>
        </div>
    `).join('');
}

// 안전한 active 탭 찾기
function toggleManualItem(id) {
    if (selectedOotdIds.includes(id)) selectedOotdIds = selectedOotdIds.filter(i => i !== id);
    else selectedOotdIds.push(id);

    // 현재 활성화된 탭 찾기 (없으면 'all'로 간주)
    const activeTabBtn = document.querySelector('#manual-record-modal .modal-tab-btn.active');
    const cat = activeTabBtn ? activeTabBtn.dataset.cat : 'all';

    renderManualItems(cat);
}

function filterManualItems(cat, btn) {
    document.querySelectorAll('#manual-record-modal .modal-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderManualItems(cat);
}

// 전송 함수 호출 확인
async function submitManualRecord() {
    if (selectedOotdIds.length === 0) { alert("선택해주세요!"); return; }

    const names = globalData.clothes.filter(c => selectedOotdIds.includes(c.id)).map(c => c.name).join(', ');

    await sendLogToServer({
        memberId: currentUser.id, date: targetDate,
        type: "COMBINATION", isPublic: false, imageUrl: null,
        comment: names, clothesIds: selectedOotdIds
    });
    toggleModal('manual-record-modal', false);
}

// 함수 정의 확인
async function sendLogToServer(data) {
    try {
        const res = await fetch(`${API_BASE}/log`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if(res.ok) {
            alert("저장되었습니다!");
            toggleModal('record-modal', false);
            loadServerData();
        }
    } catch(e) { console.error(e); alert("오류"); }
}

function openDateDetail(dateStr) {
    targetDate = dateStr;
    const dayLogs = globalData.logs.filter(l => l.dateStr === dateStr);
    if(dayLogs.length === 0) openRecordModal(dateStr);
    else renderDateDetailModal(dateStr, dayLogs);
}

function renderDateDetailModal(dateStr, logs) {
    const listContainer = document.getElementById('date-log-list');
    document.getElementById('detail-date-title').innerText = dateStr;

    listContainer.innerHTML = logs.map(log => {
        // 1. 사진 기록인 경우
        if (log.type === 'PHOTO') {
            return `
                <div class="date-log-group edit-mode-card">
                    <div class="log-group-header">
                        <span class="log-type-badge PHOTO">📸 인증샷</span>
                        <button class="delete-log-btn" onclick="deleteLog(${log.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    
                    <div class="photo-log-content">
                        <img src="${log.img}" class="log-main-img">
                        
                        <div class="edit-controls">
                            <div class="toggle-wrapper">
                                <label class="switch">
                                    <input type="checkbox" id="public-chk-${log.id}" ${log.isPublic ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                                <span class="toggle-label">홈 피드 공개</span>
                            </div>

                            <div class="comment-edit-box">
                                <input type="text" id="comment-input-${log.id}" class="edit-input" value="${log.comment || ''}" placeholder="멘트를 입력하세요">
                                <button class="save-mini-btn" onclick="updateLogItem(${log.id})">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        // 2. 코디 조합인 경우
        else {
            const items = (log.clothesIds || []).map(id => globalData.clothes.find(c => Number(c.id) === Number(id))).filter(i => i);
            const itemsHtml = items.map(i => `
                <div class="closet-list-item">
                    <img src="${i.img}" class="item-thumb">
                    <div class="item-info"><strong class="item-name">${i.name}</strong><span class="item-cat">${i.category}</span></div>
                </div>
            `).join('');

            return `
                <div class="date-log-group">
                    <div class="log-group-header"><span class="log-type-badge COMBINATION">👕 코디</span><button class="delete-log-btn" onclick="deleteLog(${log.id})"><i class="fa-solid fa-trash"></i></button></div>
                    <div class="closet-log-list">${itemsHtml}</div>
                    </div>
            `;
        }
    }).join('');
    toggleModal('date-detail-modal', true);
}

// 실제 서버로 수정 요청을 보내는 함수
async function updateLogItem(logId) {
    const isPublic = document.getElementById(`public-chk-${logId}`).checked;
    const comment = document.getElementById(`comment-input-${logId}`).value;

    try {
        const res = await fetch(`${API_BASE}/log/${logId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isPublic: isPublic,
                comment: comment
            })
        });

        if (res.ok) {
            alert("수정되었습니다! ✨");
            // 데이터를 다시 로드해서 화면 갱신
            await loadServerData();

            // 모달 내용을 갱신된 데이터로 다시 그림 (UX 향상)
            const updatedLogs = globalData.logs.filter(l => l.dateStr === targetDate);
            renderDateDetailModal(targetDate, updatedLogs);
        } else {
            alert("수정 실패 ");
        }
    } catch (e) {
        console.error(e);
        alert("서버 연결 오류");
    }
}

function openRecordModalFromDetail() {
    toggleModal('date-detail-modal', false);
    openRecordModal(targetDate);
}

async function deleteLog(id) {
    if(!confirm("삭제할까요?")) return;
    try {
        const res = await fetch(`${API_BASE}/log/${id}`, { method: 'DELETE' });
        if(res.ok) {
            alert("삭제됨");
            toggleModal('date-detail-modal', false);
            loadServerData();
        }
    } catch(e) { console.error(e); }
}

function getCategoryIcon(cat) {
    switch (cat) { case '아우터': return '🧥'; case '상의': return '👕'; case '하의': return '👖'; case '신발': return '👟'; default: return '👚'; }
}
function getStyleName(code) {
    const map = { 'MINIMAL':'미니멀', 'CASUAL':'캐주얼', 'STREET':'스트릿', 'VINTAGE':'빈티지', 'LOVELY':'러블리', 'SPORTY':'스포티' };
    return map[code] || code;
}
function switchTab(name, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById('tab-' + name).style.display = 'block';
}
window.addEventListener('click', (e) => {
    if(e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
    if(e.target.classList.contains('close-icon') || e.target.classList.contains('modal-close-btn')) {
        const modal = e.target.closest('.modal-overlay');
        if(modal) modal.style.display = 'none';
    }
});


let currentTargetUser = null; // 현재 보고 있는 남의 프로필 정보

async function openUserProfile(targetId) {
    if (!targetId || targetId === 'undefined') {
        console.error("유저 ID가 전달되지 않았습니다.");
        return;
    }
    if(targetId === currentUser.id) {
        location.hash = '#mypage'; // 나면 마이페이지로
        return;
    }

    try {
        // 프로필 정보와 OOTD 로그를 동시에 불러옵니다.
        const [profileRes, logRes] = await Promise.all([
            fetch(`${API_BASE}/social/profile/${targetId}?myId=${currentUser.id}`),
            fetch(`${API_BASE}/log/${targetId}?myId=${currentUser.id}`)
        ]);

        const profileData = await profileRes.json();
        const logData = await logRes.json();

        // DTO를 JS 객체로 변환하고 (mapLogs 재사용)
        const otherUserLogs = mapLogs(logData);
        // 공개(isPublic)인 게시물만 필터링합니다.
        const publicLogs = otherUserLogs.filter(log => log.isPublic);

        // 현재 보고 있는 유저의 정보에 OOTD 목록을 추가하여 저장
        currentTargetUser = { ...profileData, logs: publicLogs };
        renderOtherUserProfileModal(currentTargetUser);

    } catch(e) {
        console.error("프로필 로딩 실패", e);
        alert("프로필 정보를 불러오는데 실패했습니다.");
    }
}

function renderOtherUserProfileModal(data) {
    const mem = data.member;
    const relation = data.relation; // NONE, PENDING, FRIEND
    const publicLogs = data.logs || [];
    // 버튼 상태 결정
    let btnHtml = '';
    if (relation === 'FRIEND') {
        btnHtml = `<button class="action-btn following" onclick="requestFollow(${mem.id})">Ref 중 (언팔로우)</button>`;
    } else if (relation === 'PENDING') {
        btnHtml = `<button class="action-btn pending" disabled>요청 대기중...</button>`;
    } else {
        btnHtml = `<button class="action-btn follow" onclick="requestFollow(${mem.id})">+ Ref 요청하기</button>`;
    }
    // OOTD 목록 HTML 생성
    const logHtml = publicLogs.length > 0 ? publicLogs.map(feed => {
        // 날짜 포맷팅
        const displayDate = feed.dateStr.slice(5).replace('-', '.');
        return `
            <div class="profile-grid-item" onclick="openDateDetail('${feed.dateStr}')"> 
                <img src="${feed.img}">
                <span class="feed-date-badge">${displayDate}</span>
            </div>
        `;
    }).join('') : '<p style="text-align:center; color:#999; margin-top:30px;">공개된 OOTD 리스트가 없습니다.</p>';
    // 모달 HTML 구성
    const html = `
        <div class="bottom-sheet full-height">
            <div class="modal-header">
                <h3>${mem.nickname}님의 프로필</h3>
                <button class="close-icon" onclick="toggleModal('user-profile-modal', false)">&times;</button>
            </div>
            
            <div class="style-profile-card" style="margin-top:0; box-shadow:none; border:none; padding: 0;">
                <div class="profile-row-top" style="margin-bottom:20px;">
                     <div class="profile-text-info">
                        <h2 class="user-nickname" style="font-size:28px;">${mem.nickname}</h2>
                        <div class="profile-social-stats">
                            <div class="stat-group"><span class="stat-num">${data.matesCount}</span><span class="stat-label">Mates</span></div>
                            <div class="divider"></div>
                            <div class="stat-group"><span class="stat-num">${data.refsCount}</span><span class="stat-label">Refs</span></div>
                        </div>
                        <p class="user-bio">${mem.styleTags || '패션을 사랑하는 패피'}</p>
                    </div>
                    <div class="profile-img-box">
                        <img src="${mem.profileImg}" style="width:100px; height:100px;">
                    </div>
                </div>
                ${btnHtml}
            </div>


        </div>
    `;

    // 모달 컨테이너 만들어서 띄우기
    let modal = document.getElementById('user-profile-modal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'user-profile-modal';
        modal.className = 'modal-overlay'   ;
        document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    toggleModal('user-profile-modal', true);
}

// 팔로우 요청 API
async function requestFollow(targetId) {
    try {
        const res = await fetch(`${API_BASE}/social/follow`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ senderId: currentUser.id, receiverId: targetId })
        });
        if(res.ok) {
            alert("요청이 처리되었습니다.");
            openUserProfile(targetId); // 화면 갱신
        }
    } catch(e) { console.error(e); }
}
// ================================================================
// 회원가입 관련 함수들
// ================================================================

// 1. 회원가입 모달 열기 (로그인 창은 닫고 열어야 함)
function openSignupModal() {
    // 로그인 모달이 열려있다면 닫기
    toggleModal('login-modal', false);
    // 회원가입 모달 열기
    toggleModal('signup-modal', true);
}

// 2. 스타일 태그 선택 토글 (버튼 누를 때 색깔 바뀌게)
let signupSelectedStyles = [];

function toggleSignupStyle(btn, styleCode) {
    // 이미 선택된 거면 뺴기
    if (signupSelectedStyles.includes(styleCode)) {
        signupSelectedStyles = signupSelectedStyles.filter(s => s !== styleCode);
        btn.classList.remove('selected');
    }
    // 선택 안 된 거면 넣기
    else {
        signupSelectedStyles.push(styleCode);
        btn.classList.add('selected');
    }
}

// 3. 회원가입 요청 보내기 (가입 완료 버튼 클릭 시)
async function handleSignup() {
    const id = document.getElementById('signup-id').value;
    const pw = document.getElementById('signup-pw').value;
    const nick = document.getElementById('signup-nickname').value;

    if (!id || !pw || !nick) {
        alert("아이디, 비밀번호, 닉네임을 모두 입력해주세요!");
        return;
    }

    const payload = {
        userId: id,
        password: pw,
        nickname: nick,
        styleTags: signupSelectedStyles.join(',') // 배열을 문자열로 변환 (예: "MINIMAL,CASUAL")
    };

    try {
        const res = await fetch(`${API_BASE}/auth/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("가입 성공!  로그인해주세요.");
            toggleModal('signup-modal', false); // 가입창 닫기
            toggleModal('login-modal', true);   // 로그인창 다시 열기
        } else {
            alert("가입 실패  (이미 있는 아이디일 수도 있어요)");
        }
    } catch (e) {
        console.error(e);
        alert("서버 오류가 발생했습니다.");
    }
}
// ================================================================
// 날씨 API 연동 (OpenWeatherMap)
// ================================================================
async function fetchWeather() {
    // 1. 위치 정보 가져오기 (브라우저 내장 기능)
    if (!navigator.geolocation) {
        updateWeatherUI("서울", 20, "Clear", 0);
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const API_KEY = "";

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
            const res = await fetch(url);
            const data = await res.json();

            // 데이터 추출
            const temp = Math.round(data.main.temp);
            const weatherMain = data.weather[0].main; // Rain, Snow, Clouds, Clear
            const windSpeed = data.wind.speed; // m/s 단위
            const locationName = data.name;
            currentWeatherInfo = `${locationName} 기온 ${temp}도, 날씨 상태: ${weatherMain}`;
            console.log("AI에게 보낼 날씨 정보 저장 완료:", currentWeatherInfo);
            updateWeatherUI(locationName, temp, weatherMain, windSpeed);

        } catch (e) {
            console.error("날씨 가져오기 실패:", e);
            updateWeatherUI("서울", 15, "Clear", 0); // 실패 시 기본값
        }
    }, (err) => {
        console.error("위치 권한 거부됨:", err);
        updateWeatherUI("서울", 15, "Clear", 0);
    });
}

function updateWeatherUI(loc, temp, condition, wind) {
    const iconEl = document.getElementById('weather-icon-display');
    const tempEl = document.getElementById('weather-temp-display');
    const commentEl = document.getElementById('weather-comment-display');

    if(!iconEl || !tempEl) return;

    // 1. 아이콘 & 멘트 결정 로직
    let icon = "☀️";
    let comment = "오늘 날씨 참 좋네요! 예쁜 코디 기대할게요.";

    // 우선순위: 눈/비 > 바람 > 흐림 > 맑음
    if (condition === 'Snow') {
        icon = "☃️";
        comment = "눈이 와요! 미끄러지지 않게 조심하세요.";
    } else if (condition === 'Rain' || condition === 'Drizzle' || condition === 'Thunderstorm') {
        icon = "☔";
        comment = "비가 오네요. 우산 챙기시고 젖지 않는 신발 추천!";
    } else if (wind >= 5.0) { // 바람이 5m/s 이상이면 바람 아이콘 (기준 조절 가능)
        icon = "🌬️";
        comment = "바람이 쌩쌩 불어요! 따뜻한 아우터 필수!";
    } else if (condition === 'Clouds') {
        icon = "☁️";
        comment = "조금 흐린 날씨지만, 기분은 맑게 가져가요!";
    } else {
        icon = "☀️"; // Clear
        comment = "햇살 좋은 날! 밝은 컬러의 옷 어때요?";
    }

    // 2. UI 업데이트
    iconEl.innerText = icon;
    tempEl.innerText = `${loc} ${temp}°C`;
    commentEl.innerText = comment;
}
/**
 * globalData.clothes를 분석하여 색상 비율을 계산하고,
 * 컬러 바 HTML과 분석 텍스트를 생성합니다.
 */
function calculateClosetPalette(clothes) {
    if (!clothes || clothes.length === 0) {
        return { html: '<div class="color-segment" style="width:100%; background:#ccc;"></div>', text: '아직 등록된 옷이 없습니다.' };
    }

    const colorCounts = {};

    clothes.forEach(item => {
        const color = item.color
            ? item.color.trim().toUpperCase()
            : 'UNKNOWN';
        colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    const totalCount = clothes.length;
    // 상위 5개 색상만 표시하도록 제한합니다.
    const sortedColors = Object.entries(colorCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5);

    const colorMap = {
        'BLACK': '#333333', 'BROWN': '#8D6E63', 'WHITE': '#F0F0F0',
        'GREY': '#A1A1A1', 'GRAY': '#A1A1A1',
        'BLUE': '#42A5F5', 'NAVY': '#1A237E', 'SKYBLUE': '#81D4FA',
        'RED': '#E57373', 'MAROON': '#880E4F', 'BURGUNDY': '#880E4F',
        'GREEN': '#81C784', 'OLIVE': '#689F38',
        'YELLOW': '#FFD54F', 'ORANGE': '#FFB74D',
        'PINK': '#F06292', 'PURPLE': '#AB47BC',
        'BEIGE': '#D7CCC8', 'CREAM': '#FFFDE7',
        'UNKNOWN': '#D7CCC8'
    };

    let colorHtml = '';
    const colorNames = [];

    sortedColors.forEach(([color, count]) => {
        const percentage = (count / totalCount) * 100;
        const hex = colorMap[color] || '#A1887F';
        colorHtml += `<div class="color-segment" style="width:${percentage.toFixed(1)}%; background:${hex};"></div>`;
        colorNames.push(color);
    });

    // 상위 2개 색상을 기반으로 분석 텍스트를 생성합니다.
    const topColor = colorNames[0] || '특정';
    const secondColor = colorNames[1] ? ` & ${colorNames[1]}` : '';
    const analysisText = `회원님은 <b>${topColor}${secondColor}</b> 계열을 주로 입으시네요!`;

    return { html: colorHtml, text: analysisText };
}
// 프로필 변경 사항 저장 함수

function saveProfileChanges() {
    // 1. 입력한 닉네임 가져오기
    const nicknameInput = document.getElementById('edit-nickname');
    const newNickname = nicknameInput.value;

    if (!newNickname || newNickname.trim() === "") {
        alert("닉네임을 입력해주세요!");
        return;
    }

    // 2. 현재 로그인한 유저 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (!currentUser || !currentUser.userId) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        return;
    }

    // 3. 서버로 전송 (AJAX/Fetch)
    //Session을 이용한 데이터 저장 및 수정 기능 -> 세션 식별자로 데이터 수정
    fetch('/api/auth/update', {   // 아까 만든 Java 컨트롤러 주소
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: currentUser.userId,  // 누구인지 식별값 전송
            nickname: newNickname        // 바꿀 닉네임 전송
        })
    })
        .then(response => {
            if (response.ok) {
                return response.json(); // 수정된 최신 회원정보 받기
            } else {
                throw new Error('서버 오류');
            }
        })
        .then(updatedUser => {
            // 4. 성공 시 처리
            alert("프로필이 저장되었습니다! 🎉");

            // 로컬스토리지 최신화 (중요: 그래야 새로고침해도 유지됨)
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // 화면 즉시 반영 (마이페이지 닉네임 등)
            const profileNameDisplay = document.getElementById('profile-nickname');
            if (profileNameDisplay) {
                profileNameDisplay.innerText = updatedUser.nickname;
            }

            // 모달 닫기
            toggleModal('edit-profile-modal', false);

            // 확실한 반영을 위해 페이지 새로고침 (선택사항)
            location.reload();
        })
        .catch(error => {
            console.error("업데이트 실패:", error);
            alert("저장에 실패했습니다.");
        });
}