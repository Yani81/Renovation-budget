import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type {
  BudgetEntry, Category, Expense, PlannedBudget, Project,
} from '../types';

/*
 * Подход: relacionни таблици с директен CRUD + оптимистично локално
 * състояние. Zustand persist пази последното свалено копие, така че
 * при отваряне без мрежа виждаш данните си (само за четене).
 * Ключ: 'remont-store-v1' — да НЕ се променя (както mycar-store-v2).
 */

interface State {
  userId: string | null;
  theme: 'auto' | 'light' | 'dark';
  activeProjectId: string | null;

  categories: Category[];
  projects: Project[];
  budgetEntries: BudgetEntry[];
  expenses: Expense[];
  plannedBudgets: PlannedBudget[];

  loading: boolean;

  setUser: (id: string | null) => void;
  setTheme: (t: State['theme']) => void;
  setActiveProject: (id: string | null) => void;

  fetchAll: () => Promise<void>;

  addBudgetEntry: (e: Omit<BudgetEntry, 'id' | 'user_id'>) => Promise<void>;
  deleteBudgetEntry: (id: string) => Promise<void>;

  addProject: (p: { name: string; allocated_amount: number | null }) => Promise<void>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addExpense: (e: Omit<Expense, 'id' | 'user_id'>) => Promise<void>;
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addCategory: (c: { name: string; color: string; icon: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  setPlanned: (project_id: string, category_id: string, amount: number) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  { name: 'Материали', color: '#b45309', icon: '🧱' },
  { name: 'Труд', color: '#1c3f8f', icon: '👷' },
  { name: 'ВиК', color: '#0e7490', icon: '🚿' },
  { name: 'Ел. инсталация', color: '#ca8a04', icon: '💡' },
  { name: 'Мебели', color: '#7c3aed', icon: '🛋️' },
  { name: 'Техника', color: '#475569', icon: '📺' },
  { name: 'Довършителни', color: '#15803d', icon: '🎨' },
  { name: 'Комунални услуги', color: '#ea580c', icon: 'svg:utilities' },
  { name: 'Други', color: '#64748b', icon: '📦' },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      userId: null,
      theme: 'auto',
      activeProjectId: null,
      categories: [],
      projects: [],
      budgetEntries: [],
      expenses: [],
      plannedBudgets: [],
      loading: false,

      setUser: (id) => set({ userId: id }),
      setTheme: (theme) => set({ theme }),
      setActiveProject: (activeProjectId) => set({ activeProjectId }),

      fetchAll: async () => {
        const uid = get().userId;
        if (!uid) return;
        set({ loading: true });
        const [cat, proj, be, exp, pb] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('projects').select('*').order('created_at'),
          supabase.from('budget_entries').select('*').order('date', { ascending: false }),
          supabase.from('expenses').select('*').order('date', { ascending: false }),
          supabase.from('planned_budgets').select('*'),
        ]);
        set({
          categories: (cat.data as Category[]) ?? [],
          projects: (proj.data as Project[]) ?? [],
          budgetEntries: (be.data as BudgetEntry[]) ?? [],
          expenses: (exp.data as Expense[]) ?? [],
          plannedBudgets: (pb.data as PlannedBudget[]) ?? [],
          loading: false,
        });
        // Първо влизане → създаваме стандартните категории
        if ((cat.data ?? []).length === 0) {
          const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: uid }));
          const { data } = await supabase.from('categories').insert(rows).select();
          if (data) set({ categories: data as Category[] });
        } else if (
          // Еднократно (на устройство) допълване за акаунти отпреди тази категория
          !localStorage.getItem('remont-seed-utilities') &&
          !(cat.data as Category[]).some((c) => c.name === 'Комунални услуги')
        ) {
          const util = DEFAULT_CATEGORIES.find((c) => c.name === 'Комунални услуги')!;
          const { data } = await supabase
            .from('categories').insert({ ...util, user_id: uid }).select().single();
          if (data)
            set({
              categories: [...get().categories, data as Category].sort((a, b) =>
                a.name.localeCompare(b.name)
              ),
            });
          localStorage.setItem('remont-seed-utilities', '1');
        }
      },

      addBudgetEntry: async (e) => {
        const uid = get().userId!;
        const { data, error } = await supabase
          .from('budget_entries').insert({ ...e, user_id: uid }).select().single();
        if (!error && data)
          set({ budgetEntries: [data as BudgetEntry, ...get().budgetEntries] });
      },
      deleteBudgetEntry: async (id) => {
        set({ budgetEntries: get().budgetEntries.filter((b) => b.id !== id) });
        await supabase.from('budget_entries').delete().eq('id', id);
      },

      addProject: async (p) => {
        const uid = get().userId!;
        const { data, error } = await supabase
          .from('projects').insert({ ...p, user_id: uid }).select().single();
        if (!error && data) set({ projects: [...get().projects, data as Project] });
      },
      updateProject: async (id, patch) => {
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
        await supabase.from('projects').update(patch).eq('id', id);
      },
      // МЕКО изтриване: проектът получава статус 'deleted' и изчезва от
      // интерфейса, но разходите му ОСТАВАТ и продължават да се броят в
      // "изхарчено общо" — изтриването НЕ връща пари в бюджета.
      deleteProject: async (id) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, status: 'deleted' as const } : p
          ),
          activeProjectId: get().activeProjectId === id ? null : get().activeProjectId,
        });
        await supabase.from('projects').update({ status: 'deleted' }).eq('id', id);
      },

      addExpense: async (e) => {
        const uid = get().userId!;
        const { data, error } = await supabase
          .from('expenses').insert({ ...e, user_id: uid }).select().single();
        if (!error && data) set({ expenses: [data as Expense, ...get().expenses] });
      },
      updateExpense: async (id, patch) => {
        set({ expenses: get().expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
        await supabase.from('expenses').update(patch).eq('id', id);
      },
      deleteExpense: async (id) => {
        set({ expenses: get().expenses.filter((e) => e.id !== id) });
        await supabase.from('expenses').delete().eq('id', id);
      },

      addCategory: async (c) => {
        const uid = get().userId!;
        const { data, error } = await supabase
          .from('categories').insert({ ...c, user_id: uid }).select().single();
        if (!error && data) set({ categories: [...get().categories, data as Category] });
      },
      deleteCategory: async (id) => {
        set({ categories: get().categories.filter((c) => c.id !== id) });
        await supabase.from('categories').delete().eq('id', id);
      },

      setPlanned: async (project_id, category_id, amount) => {
        const uid = get().userId!;
        const { data, error } = await supabase
          .from('planned_budgets')
          .upsert(
            { user_id: uid, project_id, category_id, planned_amount: amount },
            { onConflict: 'project_id,category_id' }
          )
          .select().single();
        if (!error && data) {
          const rest = get().plannedBudgets.filter(
            (p) => !(p.project_id === project_id && p.category_id === category_id)
          );
          set({ plannedBudgets: [...rest, data as PlannedBudget] });
        }
      },
    }),
    {
      name: 'remont-store-v1', // НЕ променяй този ключ
      partialize: (s) => ({
        theme: s.theme,
        activeProjectId: s.activeProjectId,
        categories: s.categories,
        projects: s.projects,
        budgetEntries: s.budgetEntries,
        expenses: s.expenses,
        plannedBudgets: s.plannedBudgets,
      }),
    }
  )
);

// ---------- Изчисления (селектори) ----------

export const totals = (s: Pick<State, 'budgetEntries' | 'expenses'>) => {
  const budget = s.budgetEntries.reduce((a, b) => a + Number(b.amount), 0);
  const spent = s.expenses.reduce((a, e) => a + Number(e.amount), 0);
  return { budget, spent, remaining: budget - spent };
};

export const projectSpent = (s: Pick<State, 'expenses'>, projectId: string) =>
  s.expenses
    .filter((e) => e.project_id === projectId)
    .reduce((a, e) => a + Number(e.amount), 0);
