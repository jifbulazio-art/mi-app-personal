// ============================================================
// app.js — Lógica principal de la app
// ============================================================

// ── TOAST ──────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function loading(el, show) {
  if (show) el.innerHTML = '<div class="loading"><span class="spinner"></span>Cargando...</div>';
}

// ── NAV ────────────────────────────────────────────────────
function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'notes') { renderCalendar(); renderSchedule(); }
}

function wTab(name, btn) {
  ['exercises','routines','session','history'].forEach(t => {
    const el = document.getElementById('wt-' + t);
    if (el) el.style.display = t === name ? '' : 'none';
  });
  document.querySelectorAll('#section-workout .sub-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (name === 'history') loadHistory();
}

function nTab(name, btn) {
  ['foods','recipes'].forEach(t => {
    const el = document.getElementById('nt-' + t);
    if (el) el.style.display = t === name ? '' : 'none';
  });
  document.querySelectorAll('#section-nutrition .sub-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function annTab(name, btn) {
  ['notepad','calendar','schedule'].forEach(t => {
    const el = document.getElementById('ant-' + t);
    if (el) el.style.display = t === name ? '' : 'none';
  });
  document.querySelectorAll('#section-notes .sub-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (name === 'calendar') { loadNotes(); loadHistory(); setTimeout(renderCalendar, 100); }
  if (name === 'schedule') loadSchedule();
}

// ── MODALS ─────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ── AUTH ───────────────────────────────────────────────────
let currentUser = null;

async function handleSignIn(e) {
  e.preventDefault();
  const email = document.getElementById('signin-email').value.trim();
  const pw = document.getElementById('signin-pw').value;
  const btn = document.getElementById('signin-btn');
  const errEl = document.getElementById('signin-error');
  errEl.style.display = 'none';
  btn.disabled = true; btn.textContent = 'Entrando...';
  try {
    await Auth.signIn(email, pw);
  } catch (err) {
    errEl.textContent = 'Email o contraseña incorrectos.';
    errEl.style.display = '';
    btn.disabled = false; btn.textContent = 'Entrar';
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const email = document.getElementById('signup-email').value.trim();
  const pw = document.getElementById('signup-pw').value;
  const pw2 = document.getElementById('signup-pw2').value;
  const btn = document.getElementById('signup-btn');
  const errEl = document.getElementById('signup-error');
  errEl.style.display = 'none';
  if (pw !== pw2) { errEl.textContent = 'Las contraseñas no coinciden.'; errEl.style.display = ''; return; }
  if (pw.length < 6) { errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.'; errEl.style.display = ''; return; }
  btn.disabled = true; btn.textContent = 'Creando cuenta...';
  try {
    await Auth.signUp(email, pw);
    errEl.style.display = '';
    errEl.style.background = 'var(--green-l)';
    errEl.style.color = 'var(--green)';
    errEl.textContent = '¡Cuenta creada! Revisá tu email para confirmar.';
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  } catch (err) {
    errEl.textContent = err.message || 'Error al crear cuenta.';
    errEl.style.display = '';
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  }
}

async function handleSignOut() {
  try { await sb.auth.signOut(); } catch(e) {}
  showAuthScreen();
}

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = '';
  document.getElementById('app-screen').classList.remove('visible');
}

async function showAppScreen(user) {
  currentUser = user;
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').classList.add('visible');
  document.getElementById('user-email-display').textContent = user.email;
  await loadAllData();
}

Auth.onAuthChange(async (event, session) => {
  if (session?.user) {
    await showAppScreen(session.user);
  } else {
    showAuthScreen();
  }
});

// ── DATA ───────────────────────────────────────────────────
let exercises = [], routines = [], foods = [], recipes = [],
    shopItems = [], notes = [], history = [], schedule = {};

async function loadAllData() {
  await Promise.all([
    loadExercises(), loadRoutines(), loadFoods(),
    loadRecipes(), loadShopItems(), loadNotes()
  ]);
}

async function loadExercises() {
  try { exercises = await dbList('exercises'); renderExercises(); } catch(e) { console.error(e); }
}
async function loadRoutines() {
  try { routines = await dbList('routines'); renderRoutines(); } catch(e) { console.error(e); }
}
async function loadFoods() {
  try { foods = await dbList('foods'); renderFoods(); } catch(e) { console.error(e); }
}
async function loadRecipes() {
  try { recipes = await dbList('recipes'); renderRecipes(); } catch(e) { console.error(e); }
}
async function loadShopItems() {
  try { shopItems = await dbList('shopping_items', 'created_at'); renderShopping(); } catch(e) { console.error(e); }
}
async function loadNotes() {
  try { notes = await dbList('notes'); renderNotes(); } catch(e) { console.error(e); }
}
async function loadHistory() {
  try { history = await dbList('workout_history'); renderHistory(); } catch(e) { console.error(e); }
}
async function loadSchedule() {
  try { schedule = await Schedule.get(); renderSchedule(); } catch(e) { console.error(e); }
}

// ── EXERCISES ──────────────────────────────────────────────
const muscleColor = {
  Pecho:'purple', Espalda:'teal', Hombros:'amber',
  Bíceps:'coral', Tríceps:'coral', Piernas:'green',
  Glúteos:'green', Abdomen:'purple', Cardio:'teal', Otro:'amber'
};

async function saveExercise() {
  const name = document.getElementById('ex-name').value.trim();
  if (!name) { toast('El nombre es obligatorio.'); return; }
  const btn = document.getElementById('ex-save-btn');
  btn.disabled = true;
  try {
    const ex = await dbInsert('exercises', {
      name,
      muscle: document.getElementById('ex-muscle').value,
      description: document.getElementById('ex-desc').value.trim() || null
    });
    exercises.unshift(ex);
    closeModal('m-add-exercise');
    ['ex-name','ex-desc'].forEach(id => document.getElementById(id).value = '');
    renderExercises();
    toast('Ejercicio guardado ✓');
  } catch(e) { toast('Error al guardar.'); }
  finally { btn.disabled = false; }
}

async function deleteExercise(id) {
  if (!confirm('¿Eliminar ejercicio?')) return;
  try {
    await dbDelete('exercises', id);
    exercises = exercises.filter(e => e.id !== id);
    renderExercises();
    toast('Eliminado.');
  } catch(e) { toast('Error al eliminar.'); }
}

function renderExercises() {
  const el = document.getElementById('exercise-list');
  if (!exercises.length) { el.innerHTML = '<div class="empty"><span class="empty-icon">🏃</span>No hay ejercicios.<br>Agregá el primero.</div>'; return; }
  el.innerHTML = exercises.map(e => `
    <div class="exer-item">
      <div style="flex:1">
        <div style="font-weight:600">${e.name}</div>
        <div style="margin-top:4px"><span class="badge badge-${muscleColor[e.muscle]||'amber'}">${e.muscle}</span></div>
        ${e.description ? `<div style="font-size:12px;color:var(--text2);margin-top:4px">${e.description}</div>` : ''}
      </div>
      <button class="btn icon danger" onclick="deleteExercise('${e.id}')">✕</button>
    </div>
  `).join('');
}

// ── ROUTINES ───────────────────────────────────────────────
let routExTemp = [];

function openRoutineModal() {
  routExTemp = [];
  document.getElementById('rout-exer-list').innerHTML = '';
  document.getElementById('rout-name').value = '';
  document.getElementById('rout-day').value = '';
  document.getElementById('rout-rest').value = '60';
  openModal('m-create-routine');
}

function addRoutineExercise() {
  if (!exercises.length) { toast('Primero agregá ejercicios.'); return; }
  routExTemp.push({ exerciseId: exercises[0].id, sets: 3, reps: 10, weight: '' });
  renderRoutineExercisesForm();
}

function renderRoutineExercisesForm() {
  document.getElementById('rout-exer-list').innerHTML = routExTemp.map((re, i) => `
    <div class="card" style="padding:10px;margin-bottom:8px">
      <div class="flex-between" style="margin-bottom:8px;gap:8px">
        <select style="flex:1" onchange="routExTemp[${i}].exerciseId=this.value">
          ${exercises.map(ex => `<option value="${ex.id}" ${ex.id===re.exerciseId?'selected':''}>${ex.name}</option>`).join('')}
        </select>
        <button class="btn icon danger" onclick="routExTemp.splice(${i},1);renderRoutineExercisesForm()">✕</button>
      </div>
      <div class="grid-3">
        <div><label>Series</label><input type="number" value="${re.sets}" min="1" onchange="routExTemp[${i}].sets=parseInt(this.value)||1"></div>
        <div><label>Reps</label><input type="number" value="${re.reps}" min="1" onchange="routExTemp[${i}].reps=parseInt(this.value)||1"></div>
        <div><label>Peso (kg)</label><input type="text" value="${re.weight}" placeholder="—" onchange="routExTemp[${i}].weight=this.value"></div>
      </div>
    </div>
  `).join('');
}

async function saveRoutine() {
  const name = document.getElementById('rout-name').value.trim();
  if (!name) { toast('El nombre es obligatorio.'); return; }
  if (!routExTemp.length) { toast('Agregá al menos un ejercicio.'); return; }
  const btn = document.getElementById('rout-save-btn');
  btn.disabled = true;
  try {
    const rout = await dbInsert('routines', {
      name,
      day_label: document.getElementById('rout-day').value.trim() || null,
      rest_seconds: parseInt(document.getElementById('rout-rest').value) || 60,
      exercises: routExTemp
    });
    routines.unshift(rout);
    closeModal('m-create-routine');
    renderRoutines();
    toast('Rutina guardada ✓');
  } catch(e) { toast('Error al guardar.'); }
  finally { btn.disabled = false; }
}

async function deleteRoutine(id) {
  if (!confirm('¿Eliminar rutina?')) return;
  try {
    await dbDelete('routines', id);
    routines = routines.filter(r => r.id !== id);
    renderRoutines();
    toast('Eliminada.');
  } catch(e) { toast('Error.'); }
}

function renderRoutines() {
  const el = document.getElementById('routine-list');
  const emptyEl = document.getElementById('routine-empty');
  if (!routines.length) { el.innerHTML = ''; emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';
  el.innerHTML = routines.map(r => {
    const exRows = (r.exercises || []).map(re => {
      const ex = exercises.find(e => e.id === re.exerciseId);
      return `<div class="list-item" style="font-size:13px">
        <div class="flex-between">
          <span>${ex ? ex.name : '?'}</span>
          <span style="color:var(--text2)">${re.sets}×${re.reps}${re.weight?' · '+re.weight+'kg':''}</span>
        </div>
      </div>`;
    }).join('');
    return `<div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${r.name}</div>
          <div class="card-sub">${r.day_label ? r.day_label+' · ' : ''}Descanso: ${r.rest_seconds}s</div>
        </div>
        <div class="flex" style="gap:6px">
          <button class="btn primary sm" onclick="startSession('${r.id}')">▶ Iniciar</button>
          <button class="btn icon danger" onclick="deleteRoutine('${r.id}')">✕</button>
        </div>
      </div>
      ${exRows}
    </div>`;
  }).join('');
}

// ── SESSION ────────────────────────────────────────────────
let sessInterval = null, restInterval = null, restRemaining = 0, restTotal = 0;
let activeSession = null;

function startSession(routineId) {
  const rout = routines.find(r => r.id === routineId);
  if (!rout) return;
  activeSession = {
    routineId, routineName: rout.name, rest: rout.rest_seconds,
    startTime: Date.now(),
    exercises: (rout.exercises || []).map(re => {
      const ex = exercises.find(e => e.id === re.exerciseId);
      return { name: ex ? ex.name : 'Ejercicio', sets: re.sets, reps: re.reps, weight: re.weight, completed: Array(re.sets).fill(false) };
    })
  };
  renderSessionUI();
  wTab('session', document.querySelectorAll('#section-workout .sub-tab')[2]);
  clearInterval(sessInterval);
  sessInterval = setInterval(() => {
    if (!activeSession) return;
    const sec = Math.floor((Date.now() - activeSession.startTime) / 1000);
    const el = document.getElementById('sess-timer');
    if (el) el.textContent = String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0');
  }, 1000);
}

function renderSessionUI() {
  document.getElementById('no-session-msg').style.display = activeSession ? 'none' : '';
  document.getElementById('active-session-ui').style.display = activeSession ? '' : 'none';
  if (!activeSession) return;
  document.getElementById('sess-rout-name').textContent = activeSession.routineName;
  document.getElementById('session-exercises').innerHTML = activeSession.exercises.map((ex, ei) => `
    <div class="card">
      <div class="card-title">${ex.name}</div>
      <div class="card-sub" style="margin-bottom:10px">${ex.sets} series × ${ex.reps} reps${ex.weight?' · '+ex.weight+'kg':''}</div>
      ${Array.from({length:ex.sets},(_,si) => `
        <div class="serie-row">
          <div class="serie-num">S${si+1}</div>
          <div style="flex:1;font-size:13px;color:var(--text2)">${ex.reps} reps${ex.weight?' · '+ex.weight+'kg':''}</div>
          <div class="serie-check ${ex.completed[si]?'done':''}" onclick="completeSerie(${ei},${si})">${ex.completed[si]?'✓':''}</div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function completeSerie(ei, si) {
  if (!activeSession) return;
  const was = activeSession.exercises[ei].completed[si];
  activeSession.exercises[ei].completed[si] = !was;
  renderSessionUI();
  if (!was) startRest(activeSession.rest);
}

function startRest(secs) {
  clearInterval(restInterval);
  restRemaining = secs; restTotal = secs;
  document.getElementById('rest-card').style.display = '';
  updateRestUI();
  restInterval = setInterval(() => {
    restRemaining--;
    if (restRemaining <= 0) { clearInterval(restInterval); document.getElementById('rest-card').style.display = 'none'; return; }
    updateRestUI();
  }, 1000);
}

function updateRestUI() {
  const el = document.getElementById('rest-timer');
  const bar = document.getElementById('rest-bar');
  if (el) el.textContent = Math.floor(restRemaining/60) + ':' + String(restRemaining%60).padStart(2,'0');
  if (bar) bar.style.width = Math.round((restRemaining/restTotal)*100) + '%';
}

function skipRest() {
  clearInterval(restInterval);
  document.getElementById('rest-card').style.display = 'none';
}

async function endSession() {
  if (!activeSession) return;
  clearInterval(sessInterval); clearInterval(restInterval);
  const dur = Math.floor((Date.now() - activeSession.startTime) / 1000);
  const total = activeSession.exercises.reduce((a,e) => a+e.sets, 0);
  const done = activeSession.exercises.reduce((a,e) => a+e.completed.filter(Boolean).length, 0);
  try {
    await dbInsert('workout_history', {
      routine_name: activeSession.routineName,
      duration_seconds: dur,
      total_series: total,
      done_series: done,
      exercises_names: activeSession.exercises.map(e => e.name),
      date_key: new Date().toISOString().slice(0,10)
    });
    toast('¡Sesión guardada! ' + done + '/' + total + ' series ✓');
  } catch(e) { toast('Error al guardar sesión.'); }
  activeSession = null;
  document.getElementById('rest-card').style.display = 'none';
  renderSessionUI();
  loadHistory();
  wTab('history', document.querySelectorAll('#section-workout .sub-tab')[3]);
}

function renderHistory() {
  const el = document.getElementById('history-list');
  if (!history.length) { el.innerHTML='<div class="empty"><span class="empty-icon">📊</span>Aún no hay sesiones.</div>'; return; }
  el.innerHTML = history.map(h => {
    const m=Math.floor(h.duration_seconds/60), s=h.duration_seconds%60;
    return `<div class="hist-item">
      <div class="flex-between">
        <div style="font-weight:600">${h.routine_name}</div>
        <div style="font-size:12px;color:var(--text2)">${new Date(h.date_key+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})}</div>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px">${m}m ${s}s · ${h.done_series}/${h.total_series} series</div>
      <div style="font-size:12px;color:var(--text3);margin-top:2px">${(h.exercises_names||[]).join(', ')}</div>
    </div>`;
  }).join('');
}

// ── FOODS ──────────────────────────────────────────────────
async function saveFood() {
  const name = document.getElementById('food-name').value.trim();
  if (!name) { toast('El nombre es obligatorio.'); return; }
  const btn = document.getElementById('food-save-btn');
  btn.disabled = true;
  try {
    const f = await dbInsert('foods', {
      name,
      portion: document.getElementById('food-portion').value.trim() || '100g',
      prot: parseFloat(document.getElementById('food-prot').value)||0,
      carb: parseFloat(document.getElementById('food-carb').value)||0,
      fat: parseFloat(document.getElementById('food-fat').value)||0,
      kcal: parseFloat(document.getElementById('food-kcal').value)||0,
    });
    foods.unshift(f);
    closeModal('m-add-food');
    ['food-name','food-portion','food-prot','food-carb','food-fat','food-kcal'].forEach(id => document.getElementById(id).value = '');
    renderFoods();
    toast('Alimento guardado ✓');
  } catch(e) { toast('Error al guardar.'); }
  finally { btn.disabled = false; }
}

async function deleteFood(id) {
  if (!confirm('¿Eliminar alimento?')) return;
  try {
    await dbDelete('foods', id);
    foods = foods.filter(f => f.id !== id);
    renderFoods();
    toast('Eliminado.');
  } catch(e) { toast('Error.'); }
}

function renderFoods() {
  const el = document.getElementById('food-list');
  if (!foods.length) { el.innerHTML='<div class="empty"><span class="empty-icon">🥦</span>No hay alimentos.</div>'; return; }
  el.innerHTML = foods.map(f => `
    <div class="food-row">
      <div class="flex-between">
        <div style="font-weight:600">${f.name}</div>
        <button class="btn icon danger" onclick="deleteFood('${f.id}')">✕</button>
      </div>
      <div style="font-size:12px;color:var(--text2);margin:3px 0">${f.portion}</div>
      <div class="flex-wrap">
        <span class="macro-pill mp">P: ${f.prot}g</span>
        <span class="macro-pill mc">C: ${f.carb}g</span>
        <span class="macro-pill mf">G: ${f.fat}g</span>
        <span class="macro-pill mk">${f.kcal} kcal</span>
      </div>
    </div>
  `).join('');
}

// ── RECIPES ────────────────────────────────────────────────
let recipeIngTemp = [];

function openRecipeModal() {
  recipeIngTemp = [];
  document.getElementById('recipe-ing-list').innerHTML = '';
  document.getElementById('recipe-name').value = '';
  document.getElementById('recipe-servings').value = '1';
  openModal('m-create-recipe');
}

function addIngredient() {
  if (!foods.length) { toast('Primero agregá alimentos.'); return; }
  recipeIngTemp.push({ foodId: foods[0].id, grams: 100 });
  renderIngredientForm();
}

function renderIngredientForm() {
  document.getElementById('recipe-ing-list').innerHTML = recipeIngTemp.map((ri, i) => `
    <div class="flex" style="margin-bottom:8px;gap:6px">
      <select style="flex:1" onchange="recipeIngTemp[${i}].foodId=this.value">
        ${foods.map(f => `<option value="${f.id}" ${f.id===ri.foodId?'selected':''}>${f.name}</option>`).join('')}
      </select>
      <input type="number" value="${ri.grams}" min="1" style="width:70px" onchange="recipeIngTemp[${i}].grams=parseFloat(this.value)||0">
      <span style="font-size:12px;color:var(--text2);padding-top:9px">g</span>
      <button class="btn icon danger" onclick="recipeIngTemp.splice(${i},1);renderIngredientForm()">✕</button>
    </div>
  `).join('');
}

async function saveRecipe() {
  const name = document.getElementById('recipe-name').value.trim();
  if (!name) { toast('El nombre es obligatorio.'); return; }
  if (!recipeIngTemp.length) { toast('Agregá ingredientes.'); return; }
  const servings = parseInt(document.getElementById('recipe-servings').value)||1;
  let prot=0, carb=0, fat=0, kcal=0;
  recipeIngTemp.forEach(ri => {
    const f = foods.find(x => x.id === ri.foodId);
    if (!f) return;
    const factor = ri.grams / 100;
    prot += f.prot*factor; carb += f.carb*factor; fat += f.fat*factor; kcal += f.kcal*factor;
  });
  const btn = document.getElementById('recipe-save-btn');
  btn.disabled = true;
  try {
    const r = await dbInsert('recipes', {
      name, servings,
      ingredients: recipeIngTemp,
      prot: Math.round(prot*10)/10, carb: Math.round(carb*10)/10,
      fat: Math.round(fat*10)/10, kcal: Math.round(kcal)
    });
    recipes.unshift(r);
    closeModal('m-create-recipe');
    renderRecipes();
    toast('Receta guardada ✓');
  } catch(e) { toast('Error al guardar.'); }
  finally { btn.disabled = false; }
}

async function deleteRecipe(id) {
  if (!confirm('¿Eliminar receta?')) return;
  try {
    await dbDelete('recipes', id);
    recipes = recipes.filter(r => r.id !== id);
    renderRecipes();
    toast('Eliminada.');
  } catch(e) { toast('Error.'); }
}

function renderRecipes() {
  const el = document.getElementById('recipe-list');
  const emptyEl = document.getElementById('recipe-empty');
  if (!recipes.length) { el.innerHTML=''; emptyEl.style.display=''; return; }
  emptyEl.style.display='none';
  el.innerHTML = recipes.map(r => `
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">${r.name}</div><div class="card-sub">${r.servings} porción${r.servings>1?'es':''}</div></div>
        <button class="btn icon danger" onclick="deleteRecipe('${r.id}')">✕</button>
      </div>
      <div class="macro-summary">
        <div class="macro-box"><div class="macro-box-val" style="color:var(--purple)">${r.prot}g</div><div class="macro-box-lbl">Proteínas</div></div>
        <div class="macro-box"><div class="macro-box-val" style="color:var(--amber)">${r.carb}g</div><div class="macro-box-lbl">Carbos</div></div>
        <div class="macro-box"><div class="macro-box-val" style="color:var(--coral)">${r.fat}g</div><div class="macro-box-lbl">Grasas</div></div>
        <div class="macro-box"><div class="macro-box-val" style="color:var(--teal)">${r.kcal}</div><div class="macro-box-lbl">kcal</div></div>
      </div>
    </div>
  `).join('');
}

// ── SHOPPING ───────────────────────────────────────────────
async function saveShopItem() {
  const name = document.getElementById('shop-item-name').value.trim();
  if (!name) { toast('El nombre es obligatorio.'); return; }
  const btn = document.getElementById('shop-save-btn');
  btn.disabled = true;
  try {
    const item = await dbInsert('shopping_items', {
      name,
      quantity: document.getElementById('shop-item-qty').value.trim() || null,
      category: document.getElementById('shop-item-cat').value,
      done: false
    });
    shopItems.unshift(item);
    document.getElementById('shop-item-name').value = '';
    document.getElementById('shop-item-qty').value = '';
    closeModal('m-add-shop');
    renderShopping();
    toast('Agregado ✓');
  } catch(e) { toast('Error.'); }
  finally { btn.disabled = false; }
}

async function toggleShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  try {
    await dbUpdate('shopping_items', id, { done: !item.done });
    item.done = !item.done;
    renderShopping();
  } catch(e) { toast('Error.'); }
}

async function deleteShopItem(id) {
  try {
    await dbDelete('shopping_items', id);
    shopItems = shopItems.filter(i => i.id !== id);
    renderShopping();
  } catch(e) { toast('Error.'); }
}

async function clearDone() {
  const doneItems = shopItems.filter(i => i.done);
  if (!doneItems.length) return;
  try {
    await Promise.all(doneItems.map(i => dbDelete('shopping_items', i.id)));
    shopItems = shopItems.filter(i => !i.done);
    renderShopping();
    toast('Comprados eliminados.');
  } catch(e) { toast('Error.'); }
}

function renderShopping() {
  const total = shopItems.length, done = shopItems.filter(i=>i.done).length;
  document.getElementById('sh-total').textContent = total;
  document.getElementById('sh-done').textContent = done;
  document.getElementById('sh-pending').textContent = total - done;
  const el = document.getElementById('shopping-list');
  if (!total) { el.innerHTML='<div class="empty"><span class="empty-icon">🛒</span>La lista está vacía.</div>'; return; }
  const groups = {};
  shopItems.forEach(i => { if(!groups[i.category]) groups[i.category]=[]; groups[i.category].push(i); });
  el.innerHTML = Object.entries(groups).map(([cat, items]) => `
    <div class="cat-label">${cat}</div>
    ${items.map(item => `
      <div class="shop-item">
        <div class="shop-chk ${item.done?'checked':''}" onclick="toggleShopItem('${item.id}')">${item.done?'✓':''}</div>
        <div style="flex:1">
          <div class="shop-name ${item.done?'done':''}">${item.name}</div>
          ${item.quantity?`<div style="font-size:12px;color:var(--text3)">${item.quantity}</div>`:''}
        </div>
        <button class="btn icon danger" onclick="deleteShopItem('${item.id}')">✕</button>
      </div>
    `).join('')}
  `).join('');
}

// ── NOTES ──────────────────────────────────────────────────
const typeLabel = { nota:'📝 Nota', recordatorio:'🔔 Recordatorio', tarea:'✅ Tarea' };
const typeBadge = { nota:'badge-purple', recordatorio:'badge-amber', tarea:'badge-green' };

async function saveNote() {
  const text = document.getElementById('new-note-text').value.trim();
  if (!text) return;
  try {
    const n = await dbInsert('notes', {
      text, type: document.getElementById('note-type').value,
      done: false, date_key: new Date().toISOString().slice(0,10)
    });
    notes.unshift(n);
    document.getElementById('new-note-text').value = '';
    renderNotes();
    toast('Nota guardada ✓');
  } catch(e) { toast('Error.'); }
}

async function toggleNote(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;
  try {
    await dbUpdate('notes', id, { done: !n.done });
    n.done = !n.done;
    renderNotes();
  } catch(e) { toast('Error.'); }
}

async function deleteNote(id) {
  try {
    await dbDelete('notes', id);
    notes = notes.filter(n => n.id !== id);
    renderNotes();
  } catch(e) { toast('Error.'); }
}

function renderNotes() {
  const el = document.getElementById('notes-list');
  if (!notes.length) { el.innerHTML='<div class="empty"><span class="empty-icon">📝</span>No hay notas.</div>'; return; }
  el.innerHTML = notes.map(n => `
    <div class="note-item" style="${n.done?'opacity:0.55':''}">
      <div class="flex-between">
        <div class="flex" style="gap:8px;flex-wrap:wrap">
          <span class="badge ${typeBadge[n.type]||'badge-purple'}">${typeLabel[n.type]||n.type}</span>
          ${n.type==='tarea'?`<span style="cursor:pointer;font-size:18px" onclick="toggleNote('${n.id}')">${n.done?'☑':'☐'}</span>`:''}
        </div>
        <div class="flex" style="gap:8px">
          <span style="font-size:11px;color:var(--text3)">${new Date(n.date_key+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'})}</span>
          <button class="btn icon danger" onclick="deleteNote('${n.id}')">✕</button>
        </div>
      </div>
      <div style="margin-top:8px;font-size:14px;line-height:1.5;${n.done?'text-decoration:line-through;color:var(--text3)':''}">${n.text}</div>
    </div>
  `).join('');
}

// ── CALENDAR ───────────────────────────────────────────────
let calDate = new Date();
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function renderCalendar() {
  const y = calDate.getFullYear(), m = calDate.getMonth();
  document.getElementById('cal-title').textContent = MONTHS[m] + ' ' + y;
  const firstDay = new Date(y,m,1).getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const today = new Date();
  const noteDates = new Set(notes.map(n => n.date_key));
  const workoutDates = new Set(history.map(h => h.date_key));
  let html = '';
  for(let i=0;i<firstDay;i++) html+='<div></div>';
  for(let d=1;d<=daysInMonth;d++){
    const dk=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    html+=`<div class="cal-day ${isToday?'today':''} ${noteDates.has(dk)?'has-note':''} ${workoutDates.has(dk)?'has-workout':''}" onclick="showCalDetail('${dk}',${d})">${d}</div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;
}

function showCalDetail(dk, d) {
  const dayNotes = notes.filter(n=>n.date_key===dk);
  const dayWorkouts = history.filter(h=>h.date_key===dk);
  const el=document.getElementById('cal-detail');
  if (!dayNotes.length && !dayWorkouts.length) { el.style.display='none'; return; }
  document.getElementById('cal-detail-title').textContent = 'Día ' + d;
  let html='';
  if (dayWorkouts.length) {
    html+='<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px">ENTRENAMIENTOS</div>';
    html+=dayWorkouts.map(h=>`<div style="font-size:13px;margin-bottom:4px">💪 ${h.routine_name} — ${Math.floor(h.duration_seconds/60)}m</div>`).join('');
  }
  if (dayNotes.length) {
    html+='<div style="font-size:12px;font-weight:700;color:var(--text2);margin:10px 0 6px">NOTAS</div>';
    html+=dayNotes.map(n=>`<div style="font-size:13px;margin-bottom:5px"><span class="badge ${typeBadge[n.type]||'badge-purple'}" style="margin-right:6px">${typeLabel[n.type]}</span>${n.text}</div>`).join('');
  }
  document.getElementById('cal-detail-body').innerHTML = html;
  el.style.display = '';
}

function calPrev() { calDate.setMonth(calDate.getMonth()-1); renderCalendar(); }
function calNext() { calDate.setMonth(calDate.getMonth()+1); renderCalendar(); }

// ── SCHEDULE ───────────────────────────────────────────────
const DAYS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const HOURS=['6:00','7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
let schEditing=null;

function renderSchedule() {
  let html=`<tr><th>Hora</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr>`;
  HOURS.forEach(h=>{
    html+=`<tr><td>${h}</td>`;
    DAYS.forEach(d=>{
      const key=d+'|'+h, val=schedule[key]||'';
      html+=`<td onclick="editSchedCell('${d}','${h}')">${val?`<div class="sch-val">${val}</div>`:''}</td>`;
    });
    html+='</tr>';
  });
  document.getElementById('schedule-table').innerHTML=html;
}

function editSchedCell(day, hour) {
  schEditing=day+'|'+hour;
  document.getElementById('m-sch-title').textContent=day+' '+hour;
  document.getElementById('sch-cell-val').value=schedule[schEditing]||'';
  openModal('m-schedule-cell');
}

async function saveSchedCell() {
  if (!schEditing) return;
  const val=document.getElementById('sch-cell-val').value.trim();
  if (val) schedule[schEditing]=val; else delete schedule[schEditing];
  try { await Schedule.save(schedule); } catch(e) { toast('Error al guardar.'); }
  closeModal('m-schedule-cell');
  renderSchedule();
}

async function deleteSchedCell() {
  if (!schEditing) return;
  delete schedule[schEditing];
  try { await Schedule.save(schedule); } catch(e) {}
  closeModal('m-schedule-cell');
  renderSchedule();
}

async function clearSched() {
  if (!confirm('¿Borrar toda la rutina semanal?')) return;
  schedule={};
  try { await Schedule.save(schedule); } catch(e) {}
  renderSchedule();
}
