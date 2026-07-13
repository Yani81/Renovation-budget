import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, projectSpent } from '../store/useStore';
import { fmtEUR } from '../lib/format';
import ProjectForm from '../components/ProjectForm';

export default function ProjectsPage() {
  const store = useStore();
  const [showForm, setShowForm] = useState(false);
  const active = store.projects.filter((p) => p.status === 'active');
  const done = store.projects.filter((p) => p.status === 'done');

  const card = (p: (typeof store.projects)[number]) => {
    const spent = projectSpent(store, p.id);
    const alloc = p.allocated_amount;
    const pct = alloc ? Math.min((spent / alloc) * 100, 100) : null;
    const over = alloc != null && spent > alloc;
    return (
      <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card" style={{ opacity: p.status === 'done' ? 0.65 : 1 }}>
          <div className="row between">
            <h2>{p.name}</h2>
            <span className="amount-out tnum">{fmtEUR(spent)}</span>
          </div>
          {alloc != null ? (
            <>
              <div className="muted" style={{ margin: '6px 0' }}>
                Заделени {fmtEUR(alloc)} · {over ? 'надхвърлен!' : `остават ${fmtEUR(alloc - spent)}`}
              </div>
              <div className="progress">
                <div className={over ? 'over' : ''} style={{ width: `${pct}%` }} />
              </div>
            </>
          ) : (
            <div className="muted" style={{ marginTop: 4 }}>Черпи свободно от общия бюджет</div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="page">
      <div className="row between" style={{ marginBottom: 12 }}>
        <h1>Проекти</h1>
        <button className="btn-sm" onClick={() => setShowForm(true)}>+ Нов проект</button>
      </div>
      {active.length === 0 && done.length === 0 && (
        <div className="card"><p className="muted">Създай първия си ремонтен проект.</p></div>
      )}
      {active.map(card)}
      {done.length > 0 && (
        <>
          <p className="muted" style={{ margin: '16px 0 8px' }}>Приключени</p>
          {done.map(card)}
        </>
      )}
      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
