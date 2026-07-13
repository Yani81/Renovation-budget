import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { useStore } from '../store/useStore';
import { fmtEUR, fmtDate, periodRange } from '../lib/format';
import type { Expense, PeriodFilter } from '../types';
import ExpenseForm from '../components/ExpenseForm';
import ProjectForm from '../components/ProjectForm';
import PeriodPicker from '../components/PeriodPicker';

type Tab = 'expenses' | 'analytics' | 'plan';

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const store = useStore();
  const project = store.projects.find((p) => p.id === id);

  const [tab, setTab] = useState<Tab>('expenses');
  const [showExpense, setShowExpense] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [showEdit, setShowEdit] = useState(false);
  const [filter, setFilter] = useState<PeriodFilter>({ period: 'all' });
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const catById = useMemo(
    () => Object.fromEntries(store.categories.map((c) => [c.id, c])),
    [store.categories]
  );

  const expenses = useMemo(() => {
    const [from, to] = periodRange(filter);
    return store.expenses.filter((e) => {
      if (e.project_id !== id) return false;
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      if (catFilter && e.category_id !== catFilter) return false;
      return true;
    });
  }, [store.expenses, id, filter, catFilter]);

  const spentAll = store.expenses
    .filter((e) => e.project_id === id)
    .reduce((a, e) => a + Number(e.amount), 0);
  const spentFiltered = expenses.reduce((a, e) => a + Number(e.amount), 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const key = e.category_id ?? 'none';
      map.set(key, (map.get(key) ?? 0) + Number(e.amount));
    }
    return [...map.entries()]
      .map(([catId, value]) => ({
        name: catById[catId]?.name ?? 'Без категория',
        color: catById[catId]?.color ?? '#64748b',
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, catById]);

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const key = e.date.slice(0, 7); // yyyy-mm
      map.set(key, (map.get(key) ?? 0) + Number(e.amount));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, value]) => ({
        month: new Date(m + '-01').toLocaleDateString('bg-BG', { month: 'short' }),
        value,
      }));
  }, [expenses]);

  if (!project) {
    return (
      <div className="page">
        <p className="muted">Проектът не е намерен.</p>
        <button className="btn-ghost" onClick={() => nav('/projects')}>← Проекти</button>
      </div>
    );
  }

  const alloc = project.allocated_amount;
  const over = alloc != null && spentAll > alloc;

  return (
    <div className="page">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="row">
          <button className="btn-ghost btn-sm" onClick={() => nav('/projects')}>←</button>
          <h1>{project.name}</h1>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setShowEdit(true)}>✏️</button>
      </div>

      <div className="card">
        <div className="row between">
          <span className="muted">Изхарчено по проекта</span>
          <span className="amount-out tnum" style={{ fontSize: '1.2rem' }}>{fmtEUR(spentAll)}</span>
        </div>
        {alloc != null && (
          <>
            <div className="progress" style={{ marginTop: 8 }}>
              <div className={over ? 'over' : ''}
                style={{ width: `${Math.min((spentAll / alloc) * 100, 100)}%` }} />
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {over
                ? `Надхвърлени заделените ${fmtEUR(alloc)} с ${fmtEUR(spentAll - alloc)}`
                : `Остават ${fmtEUR(alloc - spentAll)} от заделените ${fmtEUR(alloc)}`}
            </div>
          </>
        )}
        <div className="row" style={{ marginTop: 10 }}>
          {project.status === 'active' ? (
            <button className="btn-ghost btn-sm"
              onClick={() => store.updateProject(project.id, { status: 'done' })}>
              ✓ Маркирай като приключен
            </button>
          ) : (
            <button className="btn-ghost btn-sm"
              onClick={() => store.updateProject(project.id, { status: 'active' })}>
              ↩ Върни като активен
            </button>
          )}
          <button className="btn-danger btn-sm"
            onClick={() => {
              if (confirm(
                `Изтриване на "${project.name}"?\n\n` +
                `Проектът ще изчезне от списъка, но изхарчените по него ` +
                `${fmtEUR(spentAll)} ОСТАВАТ отчетени — парите НЕ се връщат в бюджета.`
              )) {
                store.deleteProject(project.id);
                nav('/projects');
              }
            }}>
            🗑 Изтрий
          </button>
        </div>
      </div>

      <div className="row" style={{ gap: 6, marginBottom: 12 }}>
        {([['expenses', 'Разходи'], ['analytics', 'Анализ'], ['plan', 'План']] as [Tab, string][]).map(
          ([t, label]) => (
            <span key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {label}
            </span>
          )
        )}
      </div>

      {(tab === 'expenses' || tab === 'analytics') && (
        <div className="card">
          <PeriodPicker value={filter} onChange={setFilter} />
          {tab === 'expenses' && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <span className={`chip ${catFilter === null ? 'active' : ''}`}
                onClick={() => setCatFilter(null)}>Всички</span>
              {store.categories.map((c) => (
                <span key={c.id} className={`chip ${catFilter === c.id ? 'active' : ''}`}
                  onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}>
                  {c.icon} {c.name}
                </span>
              ))}
            </div>
          )}
          <div className="row between" style={{ marginTop: 10 }}>
            <span className="muted">За избрания период</span>
            <b className="amount-out tnum">{fmtEUR(spentFiltered)}</b>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card">
          {expenses.length === 0 && <p className="muted">Няма разходи за този период.</p>}
          {expenses.map((e) => (
            <div key={e.id} className="list-item">
              <div style={{ flex: 1 }} onClick={() => { setEditing(e); setShowExpense(true); }}>
                <div>
                  {catById[e.category_id ?? '']?.icon ?? '📦'}{' '}
                  {e.description || catById[e.category_id ?? '']?.name || 'Разход'}
                </div>
                <div className="muted">
                  {fmtDate(e.date)}{e.vendor ? ` · ${e.vendor}` : ''}
                </div>
              </div>
              <div className="row">
                <span className="amount-out tnum">−{fmtEUR(e.amount)}</span>
                <button className="btn-ghost btn-sm" onClick={() => {
                  if (confirm('Изтриване на разхода?')) store.deleteExpense(e.id);
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <>
          <div className="card">
            <h2 style={{ marginBottom: 8 }}>По категории</h2>
            {byCategory.length === 0 ? (
              <p className="muted">Няма данни за периода.</p>
            ) : (
              <>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name"
                        innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtEUR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {byCategory.map((c) => (
                  <div key={c.name} className="list-item">
                    <div className="row">
                      <span style={{
                        width: 12, height: 12, borderRadius: 3,
                        background: c.color, display: 'inline-block',
                      }} />
                      {c.name}
                    </div>
                    <div className="row">
                      <span className="muted">
                        {spentFiltered > 0 ? ((c.value / spentFiltered) * 100).toFixed(0) : 0}%
                      </span>
                      <b className="tnum">{fmtEUR(c.value)}</b>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          {byMonth.length > 1 && (
            <div className="card">
              <h2 style={{ marginBottom: 8 }}>По месеци</h2>
              <div style={{ height: 180 }}>
                <ResponsiveContainer>
                  <BarChart data={byMonth}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={45} />
                    <Tooltip formatter={(v: number) => fmtEUR(v)} />
                    <Bar dataKey="value" fill="var(--money-out)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'plan' && (
        <PlanTab projectId={project.id} />
      )}

      <button className="fab" onClick={() => { setEditing(undefined); setShowExpense(true); }}>+</button>

      {showExpense && (
        <ExpenseForm projectId={project.id} existing={editing}
          onClose={() => { setShowExpense(false); setEditing(undefined); }} />
      )}
      {showEdit && <ProjectForm existing={project} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

/** Планирано vs. реално по категории */
function PlanTab({ projectId }: { projectId: string }) {
  const store = useStore();
  const planned = store.plannedBudgets.filter((p) => p.project_id === projectId);
  const plannedByCat = Object.fromEntries(planned.map((p) => [p.category_id, p.planned_amount]));

  const realByCat = new Map<string, number>();
  for (const e of store.expenses) {
    if (e.project_id !== projectId || !e.category_id) continue;
    realByCat.set(e.category_id, (realByCat.get(e.category_id) ?? 0) + Number(e.amount));
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 4 }}>Планирано vs. реално</h2>
      <p className="muted" style={{ marginBottom: 10 }}>
        Задай очаквана сума по категория и следи дали я спазваш.
      </p>
      {store.categories.map((c) => {
        const plan = Number(plannedByCat[c.id] ?? 0);
        const real = realByCat.get(c.id) ?? 0;
        const over = plan > 0 && real > plan;
        return (
          <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="row between">
              <span>{c.icon} {c.name}</span>
              <input
                inputMode="decimal"
                style={{ width: 110, padding: '7px 9px', textAlign: 'right' }}
                placeholder="план €"
                defaultValue={plan || ''}
                onBlur={(e) => {
                  const n = parseFloat(e.target.value.replace(',', '.'));
                  if (!isNaN(n) && n >= 0 && n !== plan) store.setPlanned(projectId, c.id, n);
                }}
              />
            </div>
            {plan > 0 && (
              <>
                <div className="progress" style={{ marginTop: 8 }}>
                  <div className={over ? 'over' : ''}
                    style={{ width: `${Math.min((real / plan) * 100, 100)}%` }} />
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {fmtEUR(real)} от {fmtEUR(plan)}
                  {over && <b style={{ color: 'var(--danger)' }}> · +{fmtEUR(real - plan)} над плана</b>}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
