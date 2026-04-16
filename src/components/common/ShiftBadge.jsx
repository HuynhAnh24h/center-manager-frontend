import React from 'react';
import { Sun, Sunset, Moon } from 'lucide-react';
import { SHIFT_LABEL } from '../../utils/helpers.js';

export const SHIFT_CONFIG = {
  morning:   { Icon: Sun,    bg: '#fef3c7', text: '#92400e', label: 'Buổi sáng' },
  afternoon: { Icon: Sunset, bg: '#ffe4e6', text: '#9f1239', label: 'Buổi chiều' },
  evening:   { Icon: Moon,   bg: '#e0e7ff', text: '#3730a3', label: 'Buổi tối' },
};

export function ShiftBadge({ shift, showLabel = true }) {
  const cfg = SHIFT_CONFIG[shift];
  if (!cfg) return <span>—</span>;
  const { Icon, bg, text, label } = cfg;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, color: text, padding: '3px 10px',
      borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>
      <Icon size={12} />
      {showLabel && label}
    </span>
  );
}

export function DayScheduleBadge({ schedule = [] }) {
  const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {schedule.map((s, i) => (
        <span key={i} style={{
          fontSize: 11, fontWeight: 700, padding: '2px 7px',
          borderRadius: 6, background: 'var(--gold-50)',
          border: '1px solid var(--gold-200)', color: 'var(--gold-700)',
        }}>
          {DAY_LABEL[s.dayOfWeek]} {s.startTime}–{s.endTime}
        </span>
      ))}
    </div>
  );
}
