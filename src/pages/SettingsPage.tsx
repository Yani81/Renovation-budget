import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

const COLORS = ['#b45309', '#1c3f8f', '#0e7490', '#ca8a04', '#7c3aed', '#475569', '#15803d', '#be185d'];

export default function SettingsPage() {
  const store = useStore();
  const [newCat, setNewCat] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newColor, setNewColor] = useState(COLORS[0]);

  const addCat = async () => {
    if (!newCat.trim()) return;
    await store.addCategory({ name: newCat.trim(), color: newColor, icon: newIcon });
    setNewCat('');
  };

  return (
    <div className="page">
      <h1 style={{ marginBottom: 12 }}>Настройки</h1>

      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Тема</h2>
        <div className="row" style={{ gap: 6 }}>
          {(['auto', 'light', 'dark'] as const).map((t) => (
            <span key={t} className={`chip ${store.theme === t ? 'active' : ''}`}
              onClick={() => store.setTheme(t)}>
              {t === 'auto' ? '🌗 Авто' : t === 'light' ? '☀️ Светла' : '🌙 Тъмна'}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Категории</h2>
        {store.categories.map((c) => (
          <div key={c.id} className="list-item">
            <div className="row">
              <span style={{ width: 12, height: 12, borderRadius: 3, background: c.color, display: 'inline-block' }} />
              {c.icon} {c.name}
            </div>
            <button className="btn-ghost btn-sm" onClick={() => {
              if (confirm(`Изтриване на "${c.name}"? Разходите ѝ остават без категория.`))
                store.deleteCategory(c.id);
            }}>✕</button>
          </div>
        ))}
        <label>Нова категория</label>
        <div className="row">
          <input style={{ width: 64 }} value={newIcon} onChange={(e) => setNewIcon(e.target.value)} />
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="име" />
        </div>
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <span key={c} onClick={() => setNewColor(c)} style={{
              width: 26, height: 26, borderRadius: 7, background: c, cursor: 'pointer',
              outline: newColor === c ? '3px solid var(--primary)' : 'none',
            }} />
          ))}
        </div>
        <button className="btn-sm" style={{ marginTop: 10 }} onClick={addCat}>+ Добави категория</button>
      </div>

      <div className="card">
        <button className="btn-ghost" style={{ width: '100%' }}
          onClick={async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('remont-store-v1');
            location.reload();
          }}>
          Изход
        </button>
      </div>
    </div>
  );
}
