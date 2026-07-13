import { useState } from 'react';
import { useStore } from '../store/useStore';
import { today } from '../lib/format';
import Modal from './Modal';
import type { Expense } from '../types';

export default function ExpenseForm({
  projectId, existing, onClose,
}: {
  projectId: string;
  existing?: Expense;
  onClose: () => void;
}) {
  const { categories, addExpense, updateExpense } = useStore();
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? categories[0]?.id ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [vendor, setVendor] = useState(existing?.vendor ?? '');
  const [date, setDate] = useState(existing?.date ?? today());

  const save = async () => {
    const n = parseFloat(amount.replace(',', '.'));
    if (!n || n <= 0) return;
    const payload = {
      project_id: projectId,
      category_id: categoryId || null,
      amount: n,
      description: description || null,
      vendor: vendor || null,
      date,
    };
    if (existing) await updateExpense(existing.id, payload);
    else await addExpense(payload);
    onClose();
  };

  return (
    <Modal title={existing ? 'Редакция на разход' : 'Нов разход'} kind="expense" onClose={onClose}>
      <label>Сума (€)</label>
      <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      <label>Категория</label>
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
        ))}
      </select>
      <label>Описание</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="напр. плочки за баня" />
      <label>Магазин / изпълнител</label>
      <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="напр. Практикер" />
      <label>Дата</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Отказ</button>
        <button style={{ flex: 2 }} onClick={save}>Запази разхода</button>
      </div>
    </Modal>
  );
}
