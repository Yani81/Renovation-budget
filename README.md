# Ремонт Бюджет — PWA

Общ бюджет за всички ремонти. Всеки проект си води разходите, които се
приспадат от общия бюджет. React + Vite + TypeScript + Zustand + Supabase.

## Първоначална настройка

### 1. Supabase
1. Създай нов проект в https://supabase.com
2. SQL Editor → New query → постави съдържанието на `supabase/schema.sql` → Run
3. Authentication → Providers → Email: изключи "Confirm email" (по избор, за по-лесна регистрация)
4. Settings → API → копирай Project URL и anon key

### 2. Локално
```bash
npm install
cp .env.example .env     # попълни URL и anon key
npm run dev
```

### 3. Деплой на GitHub Pages
- В `vite.config.ts`: `base: '/ИмеНаРепото/'`
- `npm run build` → качи `dist/` (или ползвай GitHub Actions)

### 4. Инсталация на iPhone
Отвори URL-а в Safari → Share → **Add to Home Screen**

## Конвенции (ВАЖНО)
- Zustand ключ: `remont-store-v1` — да НЕ се променя
- Service worker cache: `remont-v1` — вдигай версията при промяна на SW
- Заглавията на модалите са оцветени по вид запис:
  разход = медно, средства = зелено, проект = синьо
- Валута: EUR, локал bg-BG
- `base` във vite.config.ts: `'/Repo/'` за GitHub Pages, `'./'` за Capacitor

## Структура
```
supabase/schema.sql   — таблици + RLS
src/
  lib/       supabase клиент, формат на суми/дати, периоди
  store/     Zustand store с persist + CRUD към Supabase
  pages/     Auth, Dashboard, Projects, ProjectView, Settings
  components/ Modal, форми, PeriodPicker
  types/     TypeScript модели
```

## Логика на бюджета
```
Общ бюджет     = Σ budget_entries.amount
Изхарчено общо = Σ expenses.amount (всички проекти)
Оставащо       = общ бюджет − изхарчено
```
Проект с `allocated_amount` показва и собствен прогрес спрямо заделената сума.

## Версия 2 (планирано)
Снимки на касови бележки (Supabase Storage), предупреждения при 80%/100%,
CSV експорт, offline опашка за запис, "Кошче" за възстановяване на изтрити проекти.

## Изтриване на проекти (меко)
Изтриването е "меко": проектът получава статус `deleted` и изчезва от
интерфейса, но разходите му остават в базата и продължават да се броят
в "изхарчено общо" — парите НЕ се връщат в оставащия бюджет.
Възстановяване: в Supabase → Table Editor → projects → смени status на 'active'.

## Автоматичен деплой (GitHub Actions)
Workflow: `.github/workflows/deploy.yml` — билдва и публикува при всеки push към main.

Еднократна настройка в репото:
1. Settings → Secrets and variables → Actions → New repository secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Settings → Pages → Source: **GitHub Actions**
