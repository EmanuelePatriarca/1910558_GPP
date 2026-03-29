import {
  Component,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.css',
})
export class DateRangePickerComponent {

  /** Emits the selected range (with time) when Apply is clicked */
  rangeChange = output<DateRange>();
  /** Increment this from the parent to programmatically reset the picker */
  resetKey = input<number>(0);

  // ── Internal State ──────────────────────────────────────────────────────────
  isOpen = signal(false);

  /** Calendar cursor: first day of displayed month */
  private cursor = signal(this.startOfMonth(new Date()));

  /** Selected date (only date part; time comes from the spinners) */
  rangeFrom = signal<Date | null>(null);
  rangeTo   = signal<Date | null>(null);

  /** Time spinners – default 00:00 for start, 23:59 for end */
  fromHour   = signal(0);
  fromMinute = signal(0);
  toHour     = signal(23);
  toMinute   = signal(59);

  /** Hover state for live range preview */
  private hovered = signal<Date | null>(null);

  constructor() {
    effect(() => {
      const _ = this.resetKey(); // track changes
      this.rangeFrom.set(null);
      this.rangeTo.set(null);
      this.hovered.set(null);
      this.fromHour.set(0);
      this.fromMinute.set(0);
      this.toHour.set(23);
      this.toMinute.set(59);
      this.isOpen.set(false);
    }, { allowSignalWrites: true });
  }

  // ── Constants ───────────────────────────────────────────────────────────────
  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // ── Computed ────────────────────────────────────────────────────────────────
  monthLabel = computed(() =>
    this.cursor().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  hasRange = computed(() => !!this.rangeFrom() || !!this.rangeTo());

  displayValue = computed(() => {
    const f  = this.rangeFrom();
    const t  = this.rangeTo();
    const fh = this.fromHour();
    const fm = this.fromMinute();
    const th = this.toHour();
    const tm = this.toMinute();

    if (!f && !t) return '';

    const fmtDate = (d: Date) => d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const fmtTime = (h: number, m: number) => `${this.pad(h)}:${this.pad(m)}`;

    if (f && t) return `${fmtDate(f)} ${fmtTime(fh, fm)} – ${fmtDate(t)} ${fmtTime(th, tm)}`;
    if (f)      return `${fmtDate(f)} ${fmtTime(fh, fm)} – …`;
    return '';
  });

  calendarDays = computed((): CalendarDay[] => {
    const cursor      = this.cursor();
    const today       = this.startOfDay(new Date());
    const from        = this.rangeFrom();
    const to          = this.rangeTo();
    const hov         = this.hovered();
    const effectiveTo = to ?? hov;

    const firstDay = this.startOfMonth(cursor);
    const lastDay  = this.endOfMonth(cursor);
    const startPad = firstDay.getDay();
    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      days.push(this.buildDay(d, false, today, from, effectiveTo));
    }
    // Current month
    for (let d = new Date(firstDay); d <= lastDay; ) {
      days.push(this.buildDay(new Date(d), true, today, from, effectiveTo));
      d.setDate(d.getDate() + 1);
    }
    // Fill last row to complete the 6×7 grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() + i);
      days.push(this.buildDay(d, false, today, from, effectiveTo));
    }
    return days;
  });

  // ── Calendar Actions ────────────────────────────────────────────────────────
  togglePanel() { this.isOpen.update(v => !v); }
  closePanel()  { this.isOpen.set(false); }

  prevMonth() {
    this.cursor.update(c => {
      const d = new Date(c);
      d.setMonth(d.getMonth() - 1);
      return this.startOfMonth(d);
    });
  }

  nextMonth() {
    this.cursor.update(c => {
      const d = new Date(c);
      d.setMonth(d.getMonth() + 1);
      return this.startOfMonth(d);
    });
  }

  onDayClick(day: CalendarDay) {
    if (day.isDisabled) return;
    const clicked = this.startOfDay(day.date);
    const from    = this.rangeFrom();

    if (!from || (from && this.rangeTo())) {
      // Start a new selection
      this.rangeFrom.set(clicked);
      this.rangeTo.set(null);
    } else {
      // Set the end; swap if needed
      if (clicked < from) {
        this.rangeTo.set(from);
        this.rangeFrom.set(clicked);
      } else {
        this.rangeTo.set(clicked);
      }
    }
    this.hovered.set(null);
  }

  clearRange() {
    this.rangeFrom.set(null);
    this.rangeTo.set(null);
    this.hovered.set(null);
    this.fromHour.set(0);
    this.fromMinute.set(0);
    this.toHour.set(23);
    this.toMinute.set(59);
    this.rangeChange.emit({ from: null, to: null });
    this.isOpen.set(false);
  }

  applyRange() {
    if (!this.rangeFrom()) return;

    const from   = this.buildDateTime(this.rangeFrom()!, this.fromHour(), this.fromMinute());
    const toDate = this.rangeTo() ?? this.rangeFrom()!;
    const to     = this.buildDateTime(toDate, this.toHour(), this.toMinute(), 59);

    this.rangeChange.emit({ from, to });
    this.isOpen.set(false);
  }

  // ── Time Spinner Actions ─────────────────────────────────────────────────────
  private hourSignal(side: 'from' | 'to')   { return side === 'from' ? this.fromHour   : this.toHour;   }
  private minuteSignal(side: 'from' | 'to') { return side === 'from' ? this.fromMinute : this.toMinute; }

  incrementHour(side: 'from' | 'to')   { this.hourSignal(side).update(h => (h + 1) % 24); }
  decrementHour(side: 'from' | 'to')   { this.hourSignal(side).update(h => (h - 1 + 24) % 24); }
  incrementMinute(side: 'from' | 'to') { this.minuteSignal(side).update(m => (m + 1) % 60); }
  decrementMinute(side: 'from' | 'to') { this.minuteSignal(side).update(m => (m - 1 + 60) % 60); }

  onHourInput(side: 'from' | 'to', value: string) {
    const n = parseInt(value, 10);
    if (!isNaN(n)) this.hourSignal(side).set(Math.min(23, Math.max(0, n)));
  }

  onMinuteInput(side: 'from' | 'to', value: string) {
    const n = parseInt(value, 10);
    if (!isNaN(n)) this.minuteSignal(side).set(Math.min(59, Math.max(0, n)));
  }

  onWheelHour(side: 'from' | 'to', event: WheelEvent) {
    event.preventDefault();
    event.deltaY < 0 ? this.incrementHour(side) : this.decrementHour(side);
  }

  onWheelMinute(side: 'from' | 'to', event: WheelEvent) {
    event.preventDefault();
    event.deltaY < 0 ? this.incrementMinute(side) : this.decrementMinute(side);
  }

  // ── Day CSS ─────────────────────────────────────────────────────────────────
  getDayClasses(day: CalendarDay): string {
    const c: string[] = [];

    if (!day.inCurrentMonth)    c.push('text-slate-700');
    else if (day.isDisabled)    c.push('text-slate-700 cursor-not-allowed');
    else                        c.push('text-slate-300 hover:bg-slate-700/80 cursor-pointer');

    if (day.isToday && !day.isSelected) c.push('ring-1 ring-indigo-500/50');

    if      (day.isRangeStart) c.push('!bg-indigo-600 !text-white rounded-l-md');
    else if (day.isRangeEnd)   c.push('!bg-purple-600 !text-white rounded-r-md');
    else if (day.isInRange)    c.push('!bg-indigo-900/60 !text-indigo-200 rounded-none');

    if (day.isSelected && !day.isInRange) c.push('!bg-indigo-600 !text-white');

    return c.join(' ');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  pad(n: number): string { return n.toString().padStart(2, '0'); }

  private buildDateTime(date: Date, h: number, m: number, s = 0): Date {
    const d = new Date(date);
    d.setHours(h, m, s, 0);
    return d;
  }

  private buildDay(
    date: Date,
    inCurrentMonth: boolean,
    today: Date,
    from: Date | null,
    to: Date | null
  ): CalendarDay {
    const t       = date.getTime();
    const fromSod = from ? this.startOfDay(from).getTime() : null;
    const toSod   = to   ? this.startOfDay(to).getTime()   : null;

    const isRangeStart = fromSod !== null && t === fromSod;
    const isRangeEnd   = toSod   !== null && t === toSod;
    const isInRange    = fromSod !== null && toSod !== null && t > fromSod && t < toSod;
    const isSelected   = isRangeStart || isRangeEnd;

    return {
      date,
      inCurrentMonth,
      isToday: t === today.getTime(),
      isSelected,
      isInRange,
      isRangeStart,
      isRangeEnd,
      isDisabled: false,
    };
  }

  private startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  private startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
  private endOfMonth(d: Date):   Date { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
}
