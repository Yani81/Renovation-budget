import { useState } from 'react';
import { useStore } from '../store/useStore';
import { today } from '../lib/format';
import Modal from './Modal';

export default function BudgetEntryForm({ onClose }: { onClose: () => void }) {
  const { addBudgetEntry } = useStore();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());

  const save = async () => {
    const n = parseFloat(amount.replace(',', '.'));
    if (!n || n <= 0) return;
    await addBudgetEntry({ amount: n, note: note || null, date });
    onClose();
  };

  return (
    <Modal title="Добавяне на средства" kind="budget" onClose={onClose}>
      <label>Сума (€)</label>
      <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      <label>Бележка</label>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="напр. заплата юли" />
      <label>Дата</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Отказ</button>
        <button style={{ flex: 2, background: 'var(--money-in)' }} onClick={save}>
          Добави към бюджета
        </button>
      </div>
    </Modal>
  );
}
