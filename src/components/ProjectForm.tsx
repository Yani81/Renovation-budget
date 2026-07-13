import { useState } from 'react';
import { useStore } from '../store/useStore';
import Modal from './Modal';
import type { Project } from '../types';

export default function ProjectForm({
  existing, onClose,
}: {
  existing?: Project;
  onClose: () => void;
}) {
  const { addProject, updateProject } = useStore();
  const [name, setName] = useState(existing?.name ?? '');
  const [allocated, setAllocated] = useState(
    existing?.allocated_amount != null ? String(existing.allocated_amount) : ''
  );

  const save = async () => {
    if (!name.trim()) return;
    const alloc = allocated ? parseFloat(allocated.replace(',', '.')) : null;
    if (existing) await updateProject(existing.id, { name: name.trim(), allocated_amount: alloc });
    else await addProject({ name: name.trim(), allocated_amount: alloc });
    onClose();
  };

  return (
    <Modal title={existing ? 'Редакция на проект' : 'Нов проект'} kind="project" onClose={onClose}>
      <label>Име на проекта</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="напр. Ремонт баня" autoFocus />
      <label>Заделена сума (€) — по избор</label>
      <input
        inputMode="decimal"
        value={allocated}
        onChange={(e) => setAllocated(e.target.value)}
        placeholder="празно = черпи свободно от общия бюджет"
      />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Отказ</button>
        <button style={{ flex: 2 }} onClick={save}>Запази проекта</button>
      </div>
    </Modal>
  );
}
