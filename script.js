requireAuth();
const user = getCurrentUser();

/* =====================
   1. 데이터 키 & 기본값
   ===================== */

const KEY = {
  archive:    'archive_'    + user.username,
  categories: 'categories_' + user.username,
  bio:        'bio_'        + user.username,
  avatar:     'avatar_'     + user.username,
};

const DEFAULT_CATS = [
  { id: 'music', name: '음악', color: '#1A7F7A' },
  { id: 'movie', name: '영화', color: '#2F6FED' },
  { id: 'book',  name: '책',   color: '#F0742E' },
];

const COLORS = ['#1A7F7A', '#2F6FED', '#F0742E', '#20A464', '#8B5CF6', '#E11D74', '#0EA5E9', '#CA8A04', '#DC2626', '#0D9488'];

const AVATARS = [
  ['fa-regular', 'fa-circle-user'], ['fa-solid', 'fa-cat'],
  ['fa-solid', 'fa-dog'],           ['fa-solid', 'fa-fish'],
  ['fa-solid', 'fa-frog'],          ['fa-solid', 'fa-robot'],
  ['fa-solid', 'fa-ghost'],         ['fa-solid', 'fa-dragon'],
  ['fa-solid', 'fa-star'],          ['fa-solid', 'fa-heart'],
  ['fa-solid', 'fa-fire'],          ['fa-solid', 'fa-moon'],
  ['fa-solid', 'fa-music'],         ['fa-solid', 'fa-book'],
  ['fa-solid', 'fa-gamepad'],       ['fa-solid', 'fa-crown'],
  ['fa-solid', 'fa-bolt'],          ['fa-solid', 'fa-leaf'],
  ['fa-solid', 'fa-snowflake'],     ['fa-solid', 'fa-camera'],
  ['fa-solid', 'fa-gem'],           ['fa-solid', 'fa-mug-hot'],
  ['fa-solid', 'fa-headphones'],    ['fa-solid', 'fa-user'],
];


/* =====================
   2. 앱 상태
   ===================== */

let categories = JSON.parse(localStorage.getItem(KEY.categories)) || DEFAULT_CATS;
let archive    = JSON.parse(localStorage.getItem(KEY.archive))    || [];
let bio        = localStorage.getItem(KEY.bio)                    || '그 시절 내가 사랑했던 취향들';
let avatar     = JSON.parse(localStorage.getItem(KEY.avatar))     || AVATARS[0];

// 구 버전 데이터 호환 (colorIndex → color 변환)
categories = categories.map((c, i) => ({ ...c, color: c.color || COLORS[i % COLORS.length] }));

let year      = new Date().getFullYear();
let filterCat = 'all';
let filterTag = 'all';


/* =====================
   3. 유틸 함수
   ===================== */

function safe(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getCat(id)   { return categories.find(c => c.id === id); }
function getColor(id) { return (getCat(id) || {}).color || COLORS[0]; }

function save() {
  localStorage.setItem(KEY.archive,    JSON.stringify(archive));
  localStorage.setItem(KEY.categories, JSON.stringify(categories));
}


/* =====================
   4. 렌더링
   ===================== */

function renderTabs() {
  document.getElementById('navTabs').innerHTML =
    `<button class="nav-tab ${filterCat === 'all' ? 'active' : ''}" data-cat="all">전체보기</button>` +
    categories.map(c =>
      `<button class="nav-tab ${filterCat === c.id ? 'active' : ''}" data-cat="${safe(c.id)}">${safe(c.name)}</button>`
    ).join('');
}

function renderSidebar() {
  document.getElementById('railYear').textContent = `${year} Archive`;
  document.getElementById('railList').innerHTML = categories.map(c => {
    const count = archive.filter(i => i.category === c.id && i.year === year).length;
    return `<div class="rail-item ${filterCat === c.id ? 'active' : ''}" data-cat="${safe(c.id)}">
      <span>${safe(c.name)}</span><em>${count} Picks</em>
    </div>`;
  }).join('');
}

function renderStats() {
  document.getElementById('yearDisplay').textContent = year;
  document.getElementById('summaryYear').textContent = `${year}년 아카이브 현황`;
  document.getElementById('statsGrid').innerHTML = categories.map(c => {
    const count = archive.filter(i => i.category === c.id && i.year === year).length;
    return `<div class="stat-item" style="border-left: 4px solid ${getColor(c.id)}">
      <strong style="font-size:28px; font-family:var(--font-display)">${count}</strong>
      <p style="font-size:12px; color:var(--text-sub); text-transform:uppercase">${safe(c.name)}</p>
    </div>`;
  }).join('');
}

function renderTagFilter() {
  const tags = [...new Set(
    archive.filter(i => i.year === year).flatMap(i => i.tags).filter(Boolean)
  )];
  if (filterTag !== 'all' && !tags.includes(filterTag)) filterTag = 'all';

  document.getElementById('tagList').innerHTML =
    `<span class="tag-label"># Mood 추천</span>
     <div class="tag-pill ${filterTag === 'all' ? 'active' : ''}" data-tag="all">전체보기</div>` +
    tags.map(t => `<div class="tag-pill ${filterTag === t ? 'active' : ''}" data-tag="${safe(t)}">${safe(t)}</div>`).join('');
}

function renderCards() {
  if (filterCat !== 'all' && !getCat(filterCat)) filterCat = 'all';
  const filtered = archive.filter(i =>
    i.year === year &&
    (filterCat === 'all' || i.category === filterCat) &&
    (filterTag === 'all' || i.tags.includes(filterTag))
  );

  document.getElementById('cardGrid').innerHTML = filtered.map((item, idx) => `
    <div class="card ${safe(item.category)}" style="--i:${idx}; --cat-color:${getColor(item.category)}">
      <button class="btn-delete" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
      <div class="card-media"></div>
      <div class="card-type">${safe((getCat(item.category) || {}).name || item.category)}</div>
      <h3>${safe(item.title)}</h3>
      <p class="subtitle">${safe(item.subtitle)}</p>
      <div class="card-tags">
        ${item.tags.map(t => `<span class="card-tag">${safe(t)}</span>`).join('')}
      </div>
    </div>`).join('');
}

function renderCategoryModal() {
  const sel  = document.getElementById('f-category');
  const prev = sel.value;
  sel.innerHTML = categories.map(c => `<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');
  if (prev && getCat(prev)) sel.value = prev;

  document.getElementById('categoryList').innerHTML = categories.map(c => `
    <div class="category-item" style="--cat-color:${getColor(c.id)}">
      <div class="category-chip">
        <span class="category-swatch"></span>
        <span>${safe(c.name)}</span>
      </div>
      <div class="category-actions">
        <button class="cat-action-btn" data-action="edit"   data-id="${safe(c.id)}">수정</button>
        <button class="cat-action-btn" data-action="delete" data-id="${safe(c.id)}">삭제</button>
      </div>
    </div>`).join('');
}

function renderAll() {
  renderTabs();
  renderSidebar();
  renderStats();
  renderTagFilter();
  renderCards();
  renderCategoryModal();
}


/* =====================
   5. 이벤트: 필터
   ===================== */

document.getElementById('navTabs').addEventListener('click', e => {
  const btn = e.target.closest('[data-cat]');
  if (btn) { filterCat = btn.dataset.cat; renderAll(); }
});

document.getElementById('railList').addEventListener('click', e => {
  const item = e.target.closest('[data-cat]');
  if (item) { filterCat = filterCat === item.dataset.cat ? 'all' : item.dataset.cat; renderAll(); }
});

document.getElementById('tagList').addEventListener('click', e => {
  const pill = e.target.closest('[data-tag]');
  if (pill) { filterTag = pill.dataset.tag; renderAll(); }
});

document.querySelector('.year-display').addEventListener('click', e => {
  if (e.target.closest('.fa-chevron-left'))  year--;
  if (e.target.closest('.fa-chevron-right')) year++;
  renderAll();
});


/* =====================
   6. 이벤트: 카드 추가 / 삭제
   ===================== */

document.getElementById('recordForm').onsubmit = e => {
  e.preventDefault();
  archive.unshift({
    id:       Date.now(),
    year,
    category: document.getElementById('f-category').value,
    title:    document.getElementById('f-title').value,
    subtitle: document.getElementById('f-subtitle').value,
    tags:     document.getElementById('f-tags').value.split(',').map(t => t.trim()).filter(Boolean),
  });
  save();
  renderAll();
  document.getElementById('addModal').close();
  e.target.reset();
};

document.getElementById('cardGrid').addEventListener('click', e => {
  const btn = e.target.closest('.btn-delete');
  if (!btn || !confirm('정말 삭제할까요?')) return;
  archive = archive.filter(i => i.id !== Number(btn.dataset.id));
  save();
  renderAll();
});


/* =====================
   7. 이벤트: 카테고리 관리
   ===================== */

document.getElementById('categoryForm').onsubmit = e => {
  e.preventDefault();
  const name = document.getElementById('newCategoryName').value.trim();
  if (!name) return;
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase()))
    return alert('이미 같은 이름의 카테고리가 있어요.');
  const usedColors = categories.map(c => c.color);
  const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[categories.length % COLORS.length];
  categories.push({ id: `cat-${Date.now()}`, name, color });
  save();
  renderAll();
  document.getElementById('newCategoryName').value = '';
};

document.getElementById('categoryList').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const c = getCat(btn.dataset.id);
  if (!c) return;

  if (btn.dataset.action === 'edit') {
    const next = prompt('새 카테고리 이름', c.name)?.trim();
    if (!next) return;
    if (categories.some(x => x.id !== c.id && x.name.toLowerCase() === next.toLowerCase()))
      return alert('이미 같은 이름의 카테고리가 있어요.');
    c.name = next;
    save(); renderAll();
  }

  if (btn.dataset.action === 'delete') {
    if (categories.length <= 1) return alert('최소 1개의 카테고리는 남겨야 해요.');
    if (!confirm('카테고리를 삭제하면 해당 기록도 함께 삭제됩니다. 진행할까요?')) return;
    categories = categories.filter(x => x.id !== c.id);
    archive    = archive.filter(i => i.category !== c.id);
    if (filterCat === c.id) filterCat = 'all';
    save(); renderAll();
  }
});


/* =====================
   8. 모달 열기 / 닫기
   ===================== */

const openModal  = id => document.getElementById(id).showModal();
const closeModal = id => document.getElementById(id).close();

document.getElementById('openModal').onclick           = () => openModal('addModal');
document.getElementById('closeModal').onclick          = () => closeModal('addModal');
document.getElementById('openCategoryModal').onclick   = () => openModal('categoryModal');
document.getElementById('closeCategoryModal').onclick  = () => closeModal('categoryModal');
document.getElementById('closeAvatarModal').onclick    = () => closeModal('avatarModal');

document.getElementById('logoutBtn').onclick = () => { clearCurrentUser(); location.href = 'login.html'; };


/* =====================
   9. 프로필: 아바타
   ===================== */

function renderAvatar() {
  document.querySelector('.profile-avatar i').className = avatar.join(' ');
}

document.querySelector('.profile-avatar').addEventListener('click', () => {
  document.getElementById('avatarGrid').innerHTML = AVATARS.map(([p, ic]) =>
    `<button class="avatar-option ${avatar[1] === ic ? 'selected' : ''}" data-prefix="${p}" data-icon="${ic}">
      <i class="${p} ${ic}"></i>
    </button>`
  ).join('');
  openModal('avatarModal');
});

document.getElementById('avatarGrid').addEventListener('click', e => {
  const btn = e.target.closest('.avatar-option');
  if (!btn) return;
  avatar = [btn.dataset.prefix, btn.dataset.icon];
  localStorage.setItem(KEY.avatar, JSON.stringify(avatar));
  renderAvatar();
  closeModal('avatarModal');
});


/* =====================
   10. 프로필: 소개글
   ===================== */

const bioEl   = document.getElementById('profileBio');
const editBtn = document.getElementById('editBioBtn');
bioEl.textContent = bio;

editBtn.onclick = () => {
  editBtn.style.display = 'none';

  const input     = Object.assign(document.createElement('input'),  { type: 'text', value: bio, className: 'bio-input', maxLength: 50 });
  const saveBtn   = Object.assign(document.createElement('button'), { textContent: '저장', className: 'bio-save-btn' });
  const cancelBtn = Object.assign(document.createElement('button'), { textContent: '취소', className: 'bio-cancel-btn' });
  const actions   = Object.assign(document.createElement('div'),    { className: 'bio-actions' });
  actions.append(saveBtn, cancelBtn);

  bioEl.replaceWith(input);
  input.after(actions);
  input.focus();

  const restore = (doSave) => {
    if (doSave) { bio = input.value.trim() || '그 시절 내가 사랑했던 취향들'; localStorage.setItem(KEY.bio, bio); }
    input.replaceWith(bioEl);
    bioEl.textContent = bio;
    actions.remove();
    editBtn.style.display = '';
  };

  saveBtn.onclick   = () => restore(true);
  cancelBtn.onclick = () => restore(false);
  input.onkeydown   = e => { if (e.key === 'Enter') restore(true); if (e.key === 'Escape') restore(false); };
};


/* =====================
   11. 초기화
   ===================== */

document.getElementById('profileName').textContent = user.name;
document.getElementById('userBadge').textContent   = user.name + ' 님';
renderAvatar();
renderAll();
