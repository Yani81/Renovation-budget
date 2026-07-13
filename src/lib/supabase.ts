import { createClient } from '@supabase/supabase-js';

// Попълни от Supabase Dashboard → Settings → API
// Нужен е само базовият домейн (https://xxx.supabase.co) — махаме случайно добавени пътища като /rest/v1
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string)?.replace(
  /(\.supabase\.co)\/.*$/,
  '$1'
);
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML =
      '<div style="font-family:sans-serif;padding:2rem;text-align:center">' +
      '<h2>Липсва Supabase конфигурация</h2>' +
      '<p>Билдът е направен без VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.<br>' +
      'Проверете GitHub → Settings → Secrets and variables → Actions и пуснете нов deploy.</p>' +
      '</div>';
  }
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — build was made without Supabase secrets.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
