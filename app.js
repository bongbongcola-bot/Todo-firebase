const firebaseConfig = {
  apiKey: 'AIzaSyCbdmExDPKnRPK8IDid0B_mTW4rKj5vQV8',
  authDomain: 'bongbong-todo-firebase.firebaseapp.com',
  databaseURL: 'https://bongbong-todo-firebase-default-rtdb.firebaseio.com',
  projectId: 'bongbong-todo-firebase',
  storageBucket: 'bongbong-todo-firebase.firebasestorage.app',
  messagingSenderId: '1021761784433',
  appId: '1:1021761784433:web:8b1ee9d63434de5742a9d0'
};
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const empty = document.querySelector('#empty');
const status = document.querySelector('#connection-status');
let todos = [];
let filter = 'all';
let ready = false;
let todosRef;
document.querySelector('#today').textContent = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());
function setReady(value, message) { ready = value; input.disabled = !value; form.querySelector('button').disabled = !value; status.textContent = message; }
function errorMessage(error) { console.error(error); status.textContent = 'Firebase 저장에 실패했습니다. 인터넷 연결과 데이터베이스 규칙을 확인해 주세요.'; }
setReady(false, 'Firebase에 연결하는 중입니다…');
try {
  firebase.initializeApp(firebaseConfig);
  todosRef = firebase.database().ref('homeworkTodos');
  todosRef.on('value', snapshot => {
    const data = snapshot.val() || {};
    todos = Object.entries(data).filter(([, value]) => value && typeof value.text === 'string').map(([id, value]) => ({ id, ...value })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setReady(true, 'Firebase에 연결되었습니다.'); render();
  }, error => { setReady(false, 'Firebase에 접근할 수 없습니다. 데이터베이스 규칙을 확인해 주세요.'); console.error(error); });
} catch (error) { setReady(false, 'Firebase를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'); console.error(error); }
function render() {
  list.replaceChildren();
  const shown = todos.filter(todo => filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed));
  const completed = todos.filter(todo => todo.completed).length;
  document.querySelector('#total-count').textContent = todos.length;
  document.querySelector('#progress').textContent = `${completed}개 완료`;
  document.querySelector('#remaining').textContent = `남은 할 일 ${todos.length - completed}개`;
  empty.hidden = shown.length > 0 || !ready;
  empty.querySelector('strong').textContent = filter === 'all' ? '아직 할 일이 없어요' : filter === 'active' ? '진행 중인 할 일이 없어요' : '완료한 할 일이 없어요';
  empty.querySelector('p').textContent = filter === 'all' ? '오늘 이루고 싶은 일을 적어보세요.' : '다른 목록도 확인해 보세요.';
  shown.forEach(todo => {
    const item = document.createElement('li'); item.className = `todo${todo.completed ? ' completed' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'check'; checkbox.checked = !!todo.completed;
    checkbox.setAttribute('aria-label', `${todo.text} 완료 표시`);
    checkbox.addEventListener('change', () => todosRef.child(todo.id).update({ completed: checkbox.checked }).catch(errorMessage));
    const text = document.createElement('span'); text.className = 'todo-text'; text.textContent = todo.text;
    const actions = document.createElement('div'); actions.className = 'actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = '수정'; edit.setAttribute('aria-label', `${todo.text} 수정`);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '삭제'; remove.setAttribute('aria-label', `${todo.text} 삭제`);
    remove.addEventListener('click', () => todosRef.child(todo.id).remove().catch(errorMessage));
    edit.addEventListener('click', () => {
      const field = document.createElement('input'); field.className = 'edit-input'; field.value = todo.text; field.maxLength = 200; field.setAttribute('aria-label', '할 일 수정');
      text.replaceWith(field); field.focus(); field.select(); edit.textContent = '저장';
      const finish = () => { const value = field.value.trim(); if (!value) { field.focus(); return; } todosRef.child(todo.id).update({ text: value }).catch(errorMessage); };
      edit.onclick = finish;
      field.addEventListener('keydown', event => { if (event.key === 'Enter') finish(); if (event.key === 'Escape') render(); });
    }, { once: true });
    actions.append(edit, remove); item.append(checkbox, text, actions); list.append(item);
  });
}
form.addEventListener('submit', async event => { event.preventDefault(); const text = input.value.trim(); if (!ready || !text) return; try { await todosRef.push({ text, completed: false, createdAt: Date.now() }); input.value = ''; filter = 'all'; updateFilters(); render(); input.focus(); } catch (error) { errorMessage(error); } });
function updateFilters() { document.querySelectorAll('.filter').forEach(button => { const active = button.dataset.filter === filter; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); }); }
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; updateFilters(); render(); }));
render();
