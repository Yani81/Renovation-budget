import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, totals, projectSpent } from '../store/useStore';
import { fmtEUR, fmtDate } from '../lib/format';
import BudgetEntryForm from '../components/BudgetEntryForm';
import CategoryIcon from '../components/CategoryIcon';

export default function Dashboard() {
  const store = useStore();
  const { budget, spent, remaining } = totals(store);
  const [showAdd, setShowAdd] = useState(false);
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget && budget > 0;

  const active = store.projects.filter((p) => p.status === 'active');
  const recent = store.expenses.slice(0, 5);
  const catById = Object.fromEntries(store.categories.map((c) => [c.id, c]));
  const projById = Object.fromEntries(store.projects.map((p) => [p.id, p]));

  return (
    <div className="page">
      <h1 style={{ marginBottom: 12 }}>Начало</h1>

      <div className="card hero-remaining">
        <div className="label">Оставащ бюджет</div>
        <div className={`value ${remaining < 0 ? 'negative' : ''}`}>{fmtEUR(remaining)}</div>
        <div className="row between" style={{ marginTop: 14, position: 'relative' }}>
          <span className="muted">Общо: <b className="tnum">{fmtEUR(budget)}</b></span>
          <span className="muted">Изхарчено: <b className="tnum amount-out">{fmtEUR(spent)}</b></span>
        </div>
        <div className="progress" style={{ marginTop: 8, position: 'relative' }}>
          <div className={over ? 'over' : ''} style={{ width: `${pct}%` }} />
        </div>
        <button style={{ marginTop: 16, background: 'var(--money-in)' }} onClick={() => setShowAdd(true)}>
          + Добави средства
        </button>
      </div>

      {active.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 6 }}>Разходи по проекти</h2>
          {active.map((p) => {
            const s = projectSpent(store, p.id);
            const share = spent > 0 ? (s / spent) * 100 : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="list-item">
                  <div>
                    <div>{p.name}</div>
                    <div className="muted">{share.toFixed(0)}% от изхарченото</div>
                  </div>
                  <span className="amount-out tnum">{fmtEUR(s)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 6 }}>Последни разходи</h2>
          {recent.map((e) => (
            <div key={e.id} className="list-item">
              <div>
                <div>
                  <CategoryIcon icon={catById[e.category_id ?? '']?.icon ?? '📦'} />{' '}
                  {e.description || catById[e.category_id ?? '']?.name || 'Разход'}
                </div>
                <div className="muted">
                  {projById[e.project_id]?.name}
                  {projById[e.project_id]?.status === 'deleted' ? ' (изтрит)' : ''}
                  {' · '}{fmtDate(e.date)}
                </div>
              </div>
              <span className="amount-out tnum">−{fmtEUR(e.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: 6 }}>История на бюджета</h2>
        {store.budgetEntries.length === 0 && (
          <p className="muted">Добави първите средства, за да започнеш.</p>
        )}
        {store.budgetEntries.map((b) => (
          <div key={b.id} className="list-item">
            <div>
              <div>{b.note || 'Средства'}</div>
              <div className="muted">{fmtDate(b.date)}</div>
            </div>
            <div className="row">
              <span className="amount-in tnum">+{fmtEUR(b.amount)}</span>
              <button className="btn-ghost btn-sm" onClick={() => {
                if (confirm('Изтриване на записа?')) store.deleteBudgetEntry(b.id);
              }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <BudgetEntryForm onClose={() => setShowAdd(false)} />}
    </div>
  );
}
