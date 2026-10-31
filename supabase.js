// ============================================================
// ПОДКЛЮЧЕНИЕ К SUPABASE
// Вставь свои данные: Project Settings -> API
// (Project URL и ключ "anon public"; секретный ключ service_role НЕ использовать!)
// ============================================================
const SUPABASE_URL = "https://ВАШ-ПРОЕКТ.supabase.co";
const SUPABASE_KEY = "ВАШ_ANON_PUBLIC_КЛЮЧ";

const isConfigured = !SUPABASE_URL.includes("ВАШ") && !SUPABASE_KEY.includes("ВАШ");
const sb = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Сохраняет результат прохождения. Возвращает { ok: true/false }.
async function saveResult(memeCode, percent, scores) {
  if (!sb) return { ok: false, reason: "not_configured" };
  try {
    const { error } = await sb
      .from("results")
      .insert({ meme_code: memeCode, percent: percent, scores: scores });
    if (error) {
      console.error("Supabase error:", error);
      return { ok: false, reason: "db_error" };
    }
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, reason: "network" };
  }
}
