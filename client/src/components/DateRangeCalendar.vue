<template>
  <div class="date-range-calendar">
    <div class="cal-nav">
      <v-btn icon="mdi-chevron-left" size="x-small" variant="text" @click="prevMonth" />
      <span class="cal-nav-label">{{ monthName }} {{ calYear }}</span>
      <v-btn icon="mdi-chevron-right" size="x-small" variant="text" @click="nextMonth" />
    </div>
    <div v-if="mode === 'rest'" class="rest-hint">
      <v-icon size="14" color="#F97316" class="mr-1">mdi-briefcase-off</v-icon>
      Toca días para marcar descanso (máx. 2)
    </div>
    <div class="cal-grid">
      <div v-for="d in dayNames" :key="d" class="cal-hd">{{ d }}</div>
      <div v-for="(cell, i) in calendarCells" :key="i" class="cal-cell" :class="cellClass(cell)" @click="selectDay(cell)">
        <span class="cal-num">{{ cell.day }}</span>
        <div v-if="cell.isHoliday" class="cal-marker holiday-marker" title="Festivo" />
        <div v-if="cell.isWeekend && !cell.isHoliday" class="cal-marker weekend-marker" title="No laborable" />
      </div>
    </div>
    <div v-if="mode === 'vacation'" class="cal-info">
      <span v-if="modelValue.start && !modelValue.end">Selecciona fecha de fin</span>
      <span v-else-if="modelValue.start && modelValue.end">{{ formatShort(modelValue.start) }} — {{ formatShort(modelValue.end) }} <strong>({{ selectedDays }} días)</strong></span>
    </div>
    <div v-if="mode === 'rest' && restSelected?.length" class="cal-info rest-info">
      <v-icon size="14" color="#F97316" class="mr-1">mdi-calendar-check</v-icon>
      {{ restSelected.length }} de 2 días seleccionados
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: { start: string; end: string }
  workDaysPerWeek?: number
  mode?: 'vacation' | 'rest'
  restSelected?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { start: string; end: string }]
  'update:restSelected': [value: string[]]
}>()

const calMonth = ref(new Date().getMonth())
const calYear = ref(new Date().getFullYear())
const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const monthName = computed(() => monthNames[calMonth.value])
const today = new Date()

function isMexicanHoliday(date: Date): boolean {
  const m = date.getMonth() + 1; const d = date.getDate(); const dw = date.getDay(); const y = date.getFullYear()
  if (m === 1 && d === 1) return true; if (m === 5 && d === 1) return true; if (m === 9 && d === 16) return true; if (m === 12 && d === 25) return true
  if (m === 10 && d === 1 && (y - 2024) % 6 === 0) return true
  if (m === 2 && dw === 1 && d <= 7) return true; if (m === 3 && dw === 1 && d >= 15 && d <= 21) return true; if (m === 11 && dw === 1 && d >= 15 && d <= 21) return true
  return false
}
function isWeekend(date: Date, wd: number): boolean {
  const dw = date.getDay(); if (wd <= 6 && dw === 0) return true; if (wd <= 5 && dw === 6) return true; return false
}
function fmt(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function formatShort(d: string) { const dt = new Date(d + 'T12:00:00'); return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) }
function toD(str: string) { if (!str) return null; const d = new Date(str + 'T12:00:00'); return isNaN(d.getTime()) ? null : d }
function sameDay(a: Date | null, b: Date | null) { if (!a || !b) return false; return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() }
function isBetween(day: Date, s: Date | null, e: Date | null) { if (!s || !e) return false; return day > s && day < e }
function isRest(day: Date) { return props.restSelected?.some(rs => sameDay(day, toD(rs))) ?? false }

const workDays = computed(() => props.workDaysPerWeek ?? 6)

const calendarCells = computed(() => {
  const cells: any[] = []
  const first = new Date(calYear.value, calMonth.value, 1)
  const last = new Date(calYear.value, calMonth.value + 1, 0)
  const pad = first.getDay()
  const s = toD(props.modelValue.start)
  const e = toD(props.modelValue.end)

  for (let p = 0; p < pad; p++) { const d = new Date(calYear.value, calMonth.value, p - pad + 1); cells.push({ day: d.getDate(), date: d, cur: false, hol: false, wk: false, past: true, range: false, st: false, en: false, rest: false }) }
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(calYear.value, calMonth.value, d)
    const past = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    cells.push({ day: d, date: dt, cur: true, hol: isMexicanHoliday(dt), wk: isWeekend(dt, workDays.value), past, range: isBetween(dt, s, e), st: sameDay(dt, s), en: sameDay(dt, e), rest: isRest(dt) })
  }
  const rem = 42 - cells.length; for (let r = 0; r < rem; r++) { const d = new Date(calYear.value, calMonth.value + 1, r + 1); cells.push({ day: d.getDate(), date: d, cur: false, hol: false, wk: false, past: true, range: false, st: false, en: false, rest: false }) }
  return cells
})

const selectedDays = computed(() => {
  if (!props.modelValue.start || !props.modelValue.end) return 0
  const s = toD(props.modelValue.start); const e = toD(props.modelValue.end)
  if (!s || !e) return 0; return Math.round((e.getTime() - s.getTime()) / 86400000) + 1
})

function cellClass(c: any) { return { 'other-month': !c.cur, 'is-holiday': c.hol, 'is-weekend': c.wk && !c.hol, 'is-past': c.past, 'is-range': c.range, 'is-start': c.st, 'is-end': c.en, 'is-rest': c.rest, 'is-rest-blocked': props.mode === 'rest' && (c.hol || c.wk) } }

function selectDay(cell: any) {
  if (!cell.cur || cell.past) return
  if (props.mode === 'rest' && (cell.hol || cell.wk)) return
  const ds = fmt(cell.date)
  if (props.mode === 'rest') {
    const cur = [...(props.restSelected || [])]
    const idx = cur.indexOf(ds)
    if (idx > -1) cur.splice(idx, 1); else if (cur.length < 2) cur.push(ds)
    emit('update:restSelected', cur); return
  }
  if (!props.modelValue.start || (props.modelValue.start && props.modelValue.end)) { emit('update:modelValue', { start: ds, end: '' }) }
  else { const st = toD(props.modelValue.start); if (st && cell.date < st) { emit('update:modelValue', { start: ds, end: props.modelValue.start }) } else if (st && sameDay(st, cell.date)) { emit('update:modelValue', { start: '', end: '' }) } else { emit('update:modelValue', { start: props.modelValue.start, end: ds }) } }
}

function prevMonth() { if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- } else calMonth.value-- }
function nextMonth() { if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ } else calMonth.value++ }
</script>

<style scoped>
.date-range-calendar { background: rgba(255,255,255,0.02); border-radius: 14px; padding: 16px; }
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.cal-nav-label { font-size: 14px; font-weight: 700; color: #F1F5F9; }
.rest-hint { font-size: 11px; color: #F97316; text-align: center; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 4px; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-hd { font-size: 10px; font-weight: 700; color: #475569; text-align: center; padding: 6px 0; text-transform: uppercase; }
.cal-cell { border-radius: 8px; padding: 6px 4px; text-align: center; cursor: pointer; position: relative; transition: all 0.12s; min-height: 36px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cal-cell:hover { background: rgba(99,102,241,0.12); }
.other-month { opacity: 0.2; pointer-events: none; }
.is-past { opacity: 0.35; pointer-events: none; }
.cal-num { font-size: 12px; font-weight: 600; color: #94A3B8; line-height: 1; position: relative; z-index: 1; }
.is-holiday .cal-num { color: #EF4444; }
.is-weekend .cal-num { color: #64748B; }
.is-rest .cal-num { color: #F97316; font-weight: 700; }
.is-rest-blocked { cursor: not-allowed !important; }
.is-rest-blocked .cal-num { color: #475569; }
.is-rest-blocked:hover { background: transparent !important; }
.is-start .cal-num, .is-end .cal-num, .is-range .cal-num { color: #fff; }
.is-start { background: #6366F1 !important; border-radius: 8px 0 0 8px; }
.is-end { background: #6366F1 !important; border-radius: 0 8px 8px 0; }
.is-start.is-end { border-radius: 8px; }
.is-range { background: rgba(99,102,241,0.2); border-radius: 0; }
.is-rest { background: rgba(249,115,22,0.25) !important; }
.is-rest .cal-num { color: #F97316; font-weight: 700; }
.cal-marker { width: 4px; height: 4px; border-radius: 50%; position: absolute; bottom: 3px; }
.holiday-marker { background: #EF4444; }
.weekend-marker { background: #64748B; }
.cal-info { font-size: 12px; color: #6366F1; text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
.rest-info { color: #F97316; }
</style>
