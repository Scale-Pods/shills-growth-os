'use client';

import * as React from 'react';
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

export type { DateRange };

export interface DateRangeUpdate {
  range: DateRange | undefined;
  label?: string;
}

export interface DateRangePickerProps {
  value?: DateRange;
  label?: string;
  onUpdate: (values: DateRangeUpdate) => void;
  className?: string;
}

interface Preset {
  label: string;
  getValue: () => DateRange;
}

const PRESETS: Preset[] = [
  { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last 7 days', getValue: () => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }) },
  { label: 'Last 30 days', getValue: () => ({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }) },
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last 3 Months', getValue: () => ({ from: startOfDay(subMonths(new Date(), 3)), to: endOfDay(new Date()) }) },
  { label: 'Last 6 Months', getValue: () => ({ from: startOfDay(subMonths(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: 'Last 1 year', getValue: () => ({ from: startOfDay(subYears(new Date(), 1)), to: endOfDay(new Date()) }) },
  { label: 'All Time', getValue: () => ({ from: undefined, to: undefined }) },
];

export function DateRangePicker({ value, label, onUpdate, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value);
  const [tempLabel, setTempLabel] = React.useState<string | undefined>(label ?? 'Last 30 days');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setTempRange(value);
      setTempLabel(label);
    }
  }, [open, value, label]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handlePreset = (preset: Preset) => {
    setTempRange(preset.getValue());
    setTempLabel(preset.label);
  };

  const handleApply = () => {
    onUpdate({ range: tempRange, label: tempLabel });
    setOpen(false);
  };

  const handleClear = () => {
    setTempRange(undefined);
    setTempLabel('All Time');
    onUpdate({ range: undefined, label: 'All Time' });
    setOpen(false);
  };

  const displayText = value?.from
    ? value.to && value.to.getTime() !== value.from.getTime()
      ? `${format(value.from, 'LLL dd, y')} - ${format(value.to, 'LLL dd, y')}`
      : format(value.from, 'LLL dd, y')
    : label ?? 'All Time';

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px solid var(--glass-border)',
          background: open ? 'var(--fill-tertiary)' : 'var(--fill-quaternary)',
          color: 'var(--label-primary)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <CalendarIcon size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
        <span>{displayText}</span>
        <ChevronDown size={13} style={{ color: 'var(--label-tertiary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} />
      </button>

      {open && (
        <div
          className="liquid-card date-range-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 500,
            display: 'flex',
            flexDirection: 'row',
            boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            width: 'max-content',
          }}
        >
          <div style={{ padding: '8px', borderRight: '1px solid var(--separator)', width: '150px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                style={{
                  textAlign: 'left',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: tempLabel === preset.label ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
                  color: 'var(--label-primary)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '8px' }}>
            <DayPicker
              mode="range"
              selected={tempRange}
              onSelect={(range) => {
                setTempRange(range);
                setTempLabel('Custom Range');
              }}
              numberOfMonths={2}
              defaultMonth={tempRange?.from}
            />

            <div style={{ padding: '10px 4px 4px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--separator)', marginTop: '8px' }}>
              <button
                onClick={handleClear}
                style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--red)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--label-secondary)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '12.5px' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
