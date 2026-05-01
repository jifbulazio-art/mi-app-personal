// db.js — Capa de datos con Supabase

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Auth = {
  async signUp(email, password) {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error; return data;
  },
  async signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error; return data;
  },
  async signOut() { await sb.auth.signOut(); },
  async getUser() {
    const { data: { user } } = await sb.auth.getUser();
    return user;
  },
  onAuthChange(cb) { sb.auth.onAuthStateChange((event, session) => cb(event, session)); }
};

async function dbList(table, order = 'created_at') {
  const { data, error } = await sb.from(table).select('*').order(order, { ascending: false });
  if (error) throw error; return data;
}

async function dbInsert(table, row) {
  const user = await Auth.getUser();
  const { data, error } = await sb.from(table).insert({ ...row, user_id: user.id }).select().single();
  if (error) throw error; return data;
}

async function dbUpdate(table, id, changes) {
  const { data, error } = await sb.from(table).update(changes).eq('id', id).select().single();
  if (error) throw error; return data;
}

async function dbDelete(table, id) {
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

const Schedule = {
  async get() {
    const { data, error } = await sb.from('weekly_schedule').select('schedule').maybeSingle();
    if (error) throw error; return data?.schedule || {};
  },
  async save(scheduleObj) {
    const user = await Auth.getUser();
    const { error } = await sb.from('weekly_schedule').upsert(
      { user_id: user.id, schedule: scheduleObj, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
  }
};