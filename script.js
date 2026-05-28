// 인증 확인 (비로그인 시 login.html으로 이동)
requireAuth();
const currentUser = getCurrentUser();

/* =====================
   1. 데이터 (localStorage 키 & 초기값)
   ===================== */

const ARCHIVE_KEY  = 'myArchive_'            + currentUser.username;
const CATEGORY_KEY = 'archiveCategories_'    + currentUser.username;
const BIO_KEY      = 'archiveBio_'           + currentUser.username;
const AVATAR_KEY   = 'archiveAvatar_'        + currentUser.username;

const DEFAULT_CATEGORIES = [
  { id: 'music', name: '음악', colorIndex: 0, icon: 'fa-music' },
  { id: 'movie', name: '영화', colorIndex: 1, icon: 'fa-clapperboard' },
  { id: 'book',  name: '책',   colorIndex: 2, icon: 'fa-book' }
];

const ACCENT_VARS = ['--accent', '--accent-2', '--accent-3', '--accent-4'];

const AVATAR_ICONS = [
  ['fa-regular', 'fa-circle-user'],
  ['fa-solid', 'fa-user'],
  ['fa-solid', 'fa-cat'],
  ['fa-solid', 'fa-dog'],
  ['fa-solid', 'fa-fish'],
  ['fa-solid', 'fa-frog'],
  ['fa-solid', 'fa-robot'],
  ['fa-solid', 'fa-ghost'],
  ['fa-solid', 'fa-dragon'],
  ['fa-solid', 'fa-star'],
  ['fa-solid', 'fa-heart'],
  ['fa-solid', 'fa-fire'],
  ['fa-solid', 'fa-moon'],
  ['fa-solid', 'fa-music'],
  ['fa-solid', 'fa-headphones'],
  ['fa-solid', 'fa-book'],
  ['fa-solid', 'fa-gamepad'],
  ['fa-solid', 'fa-mug-hot'],
  ['fa-solid', 'fa-gem'],
  ['fa-solid', 'fa-crown'],
  ['fa-solid', 'fa-bolt'],
  ['fa-solid', 'fa-leaf'],
  ['fa-solid', 'fa-snowflake'],
  ['fa-solid', 'fa-camera'],
];

// 카테고리 불러오기 (없으면 기본값)
let categories = JSON.parse(localStorage.getItem(CATEGORY_KEY)) || DEFAULT_CATEGORIES;
categories = categories.map((cat, i) => ({
  id: cat.id,
  name: cat.name,
  colorIndex: typeof cat.colorIndex === 'number' ? cat.colorIndex : i,
  icon: cat.icon || 'fa-circle'
}));

// 취향 기록 불러오기 (없으면 빈 배열)
let archive = JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || [];
archive = archive.map(item => ({ ...item, year: item.year || 2026 }));

// 프로필 데이터 불러오기
let profileBio    = localStorage.getItem(BIO_KEY) || '그 시절 내가 사랑했던 취향들';
let currentAvatar = JSON.parse(localStorage.getItem(AVATAR_KEY)) || ['fa-regular', 'fa-circle-user'];


/* =====================
   2. 현재 상태 (필터)
   ===================== */

let currentYear = 2026;
let currentCat  = 'all';
let currentTag  = 'all';


/* =====================
   3. DOM 참조
   ===================== */

const cardGrid        = document.getElementById('cardGrid');
const navTabs         = document.getElementById('navTabs');
const railList        = document.getElementById('railList');
const statsGrid       = document.getElementById('statsGrid');
const categoryList    = document.getElementById('categoryList');
const categorySelect  = document.getElementById('f-category');
const categoryModal   = document.getElementById('categoryModal');
const categoryForm    = document.getElementById('categoryForm');
const newCategoryName = document.getElementById('newCategoryName');
const avatarModal     = document.getElementById('avatarModal');
const avatarGrid      = document.getElementById('avatarGrid');
const profileBioEl    = document.getElementById('profileBio');
const editBioBtn      = document.getElementById('editBioBtn');


/* =====================
   4. 유틸 함수
   ===================== */

// XSS 방지: 사용자 입력을 HTML에 넣기 전에 특수문자 변환
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCategoryById(id) {
  return categories.find(cat => cat.id === id);
}

function getCategoryColor(id) {
  const cat = getCategoryById(id);
  const index = cat ? cat.colorIndex : 0;
  return `var(${ACCENT_VARS[index % ACCENT_VARS.length]})`;
}

function getCategoryName(id) {
  const cat = getCategoryById(id);
  return cat ? cat.name : id;
}

function saveArchive() {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
}

function saveCategories() {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
}

// 카테고리 이름으로 고유 ID 생성 (영문·숫자만, 중복 시 타임스탬프 추가)
function createCategoryId(name) {
  const base = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const id = base || `cat-${Date.now()}`;
  return categories.some(c => c.id === id) ? `${id}-${Date.now()}` : id;
}


/* =====================
   5. 화면 그리기 (render)
   ===================== */

// 연도 텍스트 업데이트
function renderYear() {
  document.getElementById('yearDisplay').textContent = currentYear;
  document.getElementById('railYear').textContent = `${currentYear} Archive`;
  document.getElementById('summaryYear').textContent = `${currentYear}년 아카이브 현황`;
}

// 상단 카테고리 탭
function renderTabs() {
  navTabs.innerHTML = `
    <button class="nav-tab ${currentCat === 'all' ? 'active' : ''}" data-cat="all">전체보기</button>
    ${categories.map(cat => `
      <button class="nav-tab ${currentCat === cat.id ? 'active' : ''}" data-cat="${escapeHtml(cat.id)}">
        ${escapeHtml(cat.name)}
      </button>
    `).join('')}
  `;
}

// 왼쪽 사이드바 (카테고리별 Picks 수)
function renderSidebar() {
  railList.innerHTML = categories.map(cat => {
    const count = archive.filter(i => i.category === cat.id && i.year === currentYear).length;
    return `
      <div class="rail-item ${currentCat === cat.id ? 'active' : ''}" data-cat="${escapeHtml(cat.id)}">
        <span>${escapeHtml(cat.name)}</span>
        <em>${count} Picks</em>
      </div>
    `;
  }).join('');
}

// 연도별 카테고리 통계 카드
function renderStats() {
  statsGrid.innerHTML = categories.map(cat => {
    const count = archive.filter(i => i.category === cat.id && i.year === currentYear).length;
    return `
      <div class="stat-item">
        <div class="stat-icon" style="background: ${getCategoryColor(cat.id)};">
          <i class="fa-solid ${escapeHtml(cat.icon)}"></i>
        </div>
        <div>
          <strong style="font-size: 28px; font-family: var(--font-display);">${count}</strong>
          <p style="font-size: 12px; color: var(--text-sub); letter-spacing: 0.08em; text-transform: uppercase;">
            ${escapeHtml(cat.name)}
          </p>
        </div>
      </div>
    `;
  }).join('');
}

// 해시태그 Mood 필터 버튼
function renderTagPills() {
  const tags = [...new Set(
    archive
      .filter(i => i.year === currentYear)
      .flatMap(i => i.tags.map(t => t.trim()))
      .filter(Boolean)
  )];

  // 현재 태그가 목록에 없으면 전체로 초기화
  if (currentTag !== 'all' && !tags.includes(currentTag)) currentTag = 'all';

  document.getElementById('tagList').innerHTML = `
    <span class="tag-label"># Mood 추천</span>
    <div class="tag-pill ${currentTag === 'all' ? 'active' : ''}" data-tag="all">전체보기</div>
    ${tags.map(tag => `
      <div class="tag-pill ${currentTag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</div>
    `).join('')}
  `;
}

// 취향 카드 목록 (연도·카테고리·태그 필터 적용)
function renderCards() {
  // 선택된 카테고리가 삭제됐으면 전체로 초기화
  if (currentCat !== 'all' && !getCategoryById(currentCat)) currentCat = 'all';

  const filtered = archive.filter(i => {
    if (i.year !== currentYear) return false;
    if (currentCat !== 'all' && i.category !== currentCat) return false;
    if (currentTag !== 'all' && !i.tags.includes(currentTag)) return false;
    return true;
  });

  cardGrid.innerHTML = '';
  filtered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `card ${item.category}`;
    card.style.setProperty('--i', index);
    card.style.setProperty('--cat-color', getCategoryColor(item.category));
    card.innerHTML = `
      <button class="btn-delete" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
      <div class="card-media" aria-hidden="true"></div>
      <div class="card-type">${escapeHtml(getCategoryName(item.category))}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="subtitle">${escapeHtml(item.subtitle)}</p>
      <div class="card-tags">
        ${item.tags.map(t => `<span class="card-tag">${escapeHtml(t.trim())}</span>`).join('')}
      </div>
    `;
    cardGrid.appendChild(card);
  });
}

// 카테고리 관리 모달 안 목록 & 취향 추가 폼의 select
function renderCategoryList() {
  const selected = categorySelect.value;
  categorySelect.innerHTML = categories.map(cat =>
    `<option value="${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</option>`
  ).join('');
  if (selected && getCategoryById(selected)) categorySelect.value = selected;
  else if (categories[0]) categorySelect.value = categories[0].id;

  categoryList.innerHTML = categories.map(cat => `
    <div class="category-item" style="--cat-color: ${getCategoryColor(cat.id)}">
      <div class="category-chip">
        <span class="category-swatch"></span>
        <span>${escapeHtml(cat.name)}</span>
      </div>
      <div class="category-actions">
        <button class="cat-action-btn" data-action="edit"   data-id="${escapeHtml(cat.id)}">수정</button>
        <button class="cat-action-btn" data-action="delete" data-id="${escapeHtml(cat.id)}">삭제</button>
      </div>
    </div>
  `).join('');
}

// 전체 화면 한 번에 다시 그리기
function renderAll() {
  renderYear();
  renderTabs();
  renderSidebar();
  renderStats();
  renderTagPills();
  renderCards();
  renderCategoryList();
}


/* =====================
   6. 이벤트: 필터링
   ===================== */

// 카테고리 탭 클릭
navTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  currentCat = btn.dataset.cat;
  renderAll();
});

// 사이드바 클릭 (재클릭 시 전체로 복귀)
railList.addEventListener('click', (e) => {
  const item = e.target.closest('.rail-item[data-cat]');
  if (!item) return;
  currentCat = currentCat === item.dataset.cat ? 'all' : item.dataset.cat;
  renderAll();
});

// 해시태그 필터 클릭
document.getElementById('tagList').addEventListener('click', (e) => {
  const pill = e.target.closest('.tag-pill');
  if (!pill) return;
  currentTag = pill.dataset.tag;
  renderAll();
});

// 연도 앞뒤 이동
document.querySelector('.year-display').addEventListener('click', (e) => {
  const icon = e.target.closest('i');
  if (!icon) return;
  if (icon.classList.contains('fa-chevron-left'))  currentYear--;
  if (icon.classList.contains('fa-chevron-right')) currentYear++;
  renderAll();
});


/* =====================
   7. 이벤트: 취향 기록 추가 / 삭제
   ===================== */

// 취향 카드 추가 폼 제출
document.getElementById('recordForm').onsubmit = (e) => {
  e.preventDefault();
  archive.unshift({
    id:       Date.now(),
    year:     currentYear,
    category: document.getElementById('f-category').value,
    title:    document.getElementById('f-title').value,
    subtitle: document.getElementById('f-subtitle').value,
    tags:     document.getElementById('f-tags').value.split(',').map(t => t.trim())
  });
  saveArchive();
  renderAll();
  document.getElementById('addModal').close();
  e.target.reset();
};

// 카드 삭제 버튼 (이벤트 위임: cardGrid에서 한 번만 등록)
cardGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete');
  if (!btn) return;
  if (!confirm('정말 삭제할까요?')) return;
  archive = archive.filter(i => i.id !== Number(btn.dataset.id));
  saveArchive();
  renderAll();
});


/* =====================
   8. 이벤트: 카테고리 관리
   ===================== */

// 카테고리 추가
categoryForm.onsubmit = (e) => {
  e.preventDefault();
  const name = newCategoryName.value.trim();
  if (!name) return;
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('이미 같은 이름의 카테고리가 있어요.');
    return;
  }
  const nextIndex = categories.reduce((max, c) => Math.max(max, c.colorIndex), -1) + 1;
  categories.push({ id: createCategoryId(name), name, colorIndex: nextIndex, icon: 'fa-circle' });
  saveCategories();
  renderAll();
  newCategoryName.value = '';
};

// 카테고리 수정·삭제 (이벤트 위임)
categoryList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const cat = getCategoryById(btn.dataset.id);
  if (!cat) return;

  if (btn.dataset.action === 'edit') {
    const nextName = prompt('새 카테고리 이름을 입력해 주세요.', cat.name);
    if (!nextName?.trim()) return;
    const trimmed = nextName.trim();
    if (categories.some(c => c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('이미 같은 이름의 카테고리가 있어요.');
      return;
    }
    cat.name = trimmed;
    saveCategories();
    renderAll();
  }

  if (btn.dataset.action === 'delete') {
    if (categories.length <= 1) {
      alert('최소 1개의 카테고리는 남겨야 해요.');
      return;
    }
    if (!confirm('카테고리를 삭제하면 해당 기록도 함께 삭제됩니다. 진행할까요?')) return;
    categories = categories.filter(c => c.id !== cat.id);
    archive    = archive.filter(i => i.category !== cat.id);
    if (currentCat === cat.id) currentCat = 'all';
    saveCategories();
    saveArchive();
    renderAll();
  }
});


/* =====================
   9. 모달 열기 / 닫기
   ===================== */

const addModal = document.getElementById('addModal');
document.getElementById('openModal').onclick         = () => addModal.showModal();
document.getElementById('closeModal').onclick        = () => addModal.close();
document.getElementById('openCategoryModal').onclick = () => categoryModal.showModal();
document.getElementById('closeCategoryModal').onclick = () => categoryModal.close();
document.getElementById('closeAvatarModal').onclick  = () => avatarModal.close();


/* =====================
   10. 프로필: 아바타 선택
   ===================== */

function renderAvatar() {
  document.querySelector('.profile-avatar i').className = `${currentAvatar[0]} ${currentAvatar[1]}`;
}

// 아바타 클릭 → 아이콘 선택 모달
document.querySelector('.profile-avatar').addEventListener('click', () => {
  avatarGrid.innerHTML = AVATAR_ICONS.map(([prefix, icon]) => `
    <button class="avatar-option ${currentAvatar[1] === icon ? 'selected' : ''}" data-prefix="${prefix}" data-icon="${icon}">
      <i class="${prefix} ${icon}"></i>
    </button>
  `).join('');
  avatarModal.showModal();
});

// 아이콘 선택 → 저장 후 모달 닫기
avatarGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.avatar-option');
  if (!btn) return;
  currentAvatar = [btn.dataset.prefix, btn.dataset.icon];
  localStorage.setItem(AVATAR_KEY, JSON.stringify(currentAvatar));
  renderAvatar();
  avatarModal.close();
});


/* =====================
   11. 프로필: 소개글 편집
   ===================== */

profileBioEl.textContent = profileBio;

editBioBtn.onclick = () => {
  editBioBtn.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = profileBio;
  input.className = 'bio-input';
  input.maxLength = 50;

  const actions = document.createElement('div');
  actions.className = 'bio-actions';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '저장';
  saveBtn.className = 'bio-save-btn';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '취소';
  cancelBtn.className = 'bio-cancel-btn';

  actions.append(saveBtn, cancelBtn);
  profileBioEl.replaceWith(input);
  input.after(actions);
  input.focus();

  function restore() {
    input.replaceWith(profileBioEl);
    profileBioEl.textContent = profileBio;
    actions.remove();
    editBioBtn.style.display = '';
  }

  saveBtn.onclick = () => {
    profileBio = input.value.trim() || '그 시절 내가 사랑했던 취향들';
    localStorage.setItem(BIO_KEY, profileBio);
    restore();
  };
  cancelBtn.onclick = restore;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveBtn.click();
    if (e.key === 'Escape') cancelBtn.click();
  });
};


/* =====================
   12. 로그아웃
   ===================== */

document.getElementById('logoutBtn').onclick = () => {
  clearCurrentUser();
  location.href = 'login.html';
};


/* =====================
   13. 초기화
   ===================== */

document.getElementById('profileName').textContent  = currentUser.name;
document.getElementById('userBadge').textContent    = currentUser.name + ' 님';
renderAvatar();
renderAll();
