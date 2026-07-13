import type { PeriodFilter, Period } from '../types';

const LABELS: [Period, string][] = [
  ['week', 'Седмица'],
  ['month', 'Месец'],
  ['year', 'Година'],
  ['all', 'Всичко'],
  ['custom', 'Период…'],
];

export default function PeriodPicker({
  value, onChange,
}: {
  value: PeriodFilter;
  onChange: (f: PeriodFilter) => void;
}) {
  return (
    <div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {LABELS.map(([p, label]) => (
          <span
            key={p}
            className={`chip ${value.period === p ? 'active' : ''}`}
            onClick={() => onChange({ ...value, period: p })}
          >
            {label}
          </span>
        ))}
      </div>
      {value.period === 'custom' && (
        <div className="row">
          <input
            type="date"
            value={value.from ?? ''}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
          <span className="muted">до</span>
          <input
            type="date"
            value={value.to ?? ''}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
