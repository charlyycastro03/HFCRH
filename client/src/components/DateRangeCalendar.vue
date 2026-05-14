<template>
  <div class="date-range-calendar">
    <div class="cal-nav">
      <v-btn icon="mdi-chevron-left" size="x-small" variant="text" @click="prevMonth" />
      <span class="cal-nav-label">{{ monthName }} {{ calYear }}</span>
      <v-btn icon="mdi-chevron-right" size="x-small" variant="text" @click="nextMonth" />
    </div>
    <div class="cal-grid">
      <div v-for="d in dayNames" :key="d" class="cal-hd">{{ d }}</div>
      <div
        v-for="(cell, i) in calendarCells"
        :key="i"
        class="cal-cell"
        :class="cellClass(cell)"
        @click="selectDay(cell)"
      >
        <span class="cal-num">{{ cell.day }}</span>
        <div v-if="cell.isHoliday" class="cal-marker holiday-marker" title="Día festivo" />
        <div v-if="cell.isWeekend && !cell.isHoliday" class="cal-marker weekend-marker" title="No laborable" />
      </div>
    </div>
    <div v-if="modelValue.start || modelValue.end" class="cal-selection-info">
      <span v-if="modelValue.start && !modelValue.end">Selecciona fecha de fin</span>
      <span v-else-if="modelValue.start && modelValue.end">
        {{ formatShort(modelValue.start) }} — {{ formatShort(modelValue.end) }}
        <strong>({{ selectedDays }} días)</strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: { start: string; end: string }
  workDaysPerWeek?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { start: string; end: string }]
}>()

const calMonth = ref(new Date().getMonth())
const calYear = ref(new Date().getFullYear())

const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const monthName = computed(() => monthNames[calMonth.value])
const today = new Date()

function isMexicanHoliday(date: Date): boolean {
  const m = date.getMonth() + 1
  const d = date.getDate()
  const dw = date.getDay()
  const y = date.getFullYear()
  if (m === 1 && d === 1) return true
  if (m === 5 && d === 1) return true
  if (m === 9 && d === 16) return true
  if (m === 12 && d === 25) return true
  if (m === 10 && d === 1 && (y - 2024) % 6 === 0) return true
  if (m === 2 && dw === 1 && d <= 7) return true
  if (m === 3 && dw === 1 && d >= 15 && d <= 21) return true
  if (m === 11 && dw === 1 && d >= 15 && d <= 21) return true
  return false
}

function isWeekend(date: Date, workDays: number): boolean {
  const dw = date.getDay()
  if (workDays <= 6 && dw === 0) return true
  if (workDays <= 5 && dw === 6) return true
  return false
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShort(d: string) {
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function toDate(str: string): Date | null {
  if (!str) return null
  const d = new Date(str + 'T12:00:00')
  return isNaN(d.getTime()) ? null : d
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

function isBetween(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false
  return day > start && day < end
}

const companyWorkDays = computed(() => props.workDaysPerWeek ?? 6)

const calendarCells = computed(() => {
  const cells: any[] = []
  const firstDay = new Date(calYear.value, calMonth.value, 1)
  const lastDay = new Date(calYear.value, calMonth.value + 1, 0)
  const startPad = firstDay.getDay()
  const startVal = toDate(props.modelValue.start)
  const endVal = toDate(props.modelValue.end)

  for (let p = 0; p < startPad; p++) {
    const d = new Date(calYear.value, calMonth.value, p - startPad + 1)
    cells.push({ day: d.getDate(), date: d, isCurrent: false, isHoliday: false, isWeekend: false, isPast: true, isRange: false, isStart: false, isEnd: false })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(calYear.value, calMonth.value, d)
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    cells.push({
      day: d,
      date,
      isCurrent: true,
      isHoliday: isMexicanHoliday(date),
      isWeekend: isWeekend(date, companyWorkDays.value),
      isPast,
      isRange: isBetween(date, startVal, endVal),
      isStart: isSameDay(date, startVal),
      isEnd: isSameDay(date, endVal),
    })
  }

  const remaining = 42 - cells.length
  for (let r = 0; r < remaining; r++) {
    const d = new Date(calYear.value, calMonth.value + 1, r + 1)
    cells.push({ day: d.getDate(), date: d, isCurrent: false, isHoliday: false, isWeekend: false, isPast: true, isRange: false, isStart: false, isEnd: false })
  }

  return cells
})

const selectedDays = computed(() => {
  if (!props.modelValue.start || !props.modelValue.end) return 0
  const s = toDate(props.modelValue.start)
  const e = toDate(props.modelValue.end)
  if (!s || !e) return 0
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
})

function cellClass(cell: any) {
  return {
    'other-month': !cell.isCurrent,
    'is-holiday': cell.isHoliday,
    'is-weekend': cell.isWeekend && !cell.isHoliday,
    'is-past': cell.isPast,
    'is-range': cell.isRange,
    'is-start': cell.isStart,
    'is-end': cell.isEnd,
  }
}

function selectDay(cell: any) {
  if (!cell.isCurrent || cell.isPast) return
  const dateStr = formatDate(cell.date)

  if (!props.modelValue.start || (props.modelValue.start && props.modelValue.end)) {
    emit('update:modelValue', { start: dateStr, end: '' })
  } else {
    const start = toDate(props.modelValue.start)
    if (start && cell.date < start) {
      emit('update:modelValue', { start: dateStr, end: props.modelValue.start })
    } else if (start && isSameDay(start, cell.date)) {
      emit('update:modelValue', { start: '', end: '' })
    } else {
      emit('update:modelValue', { start: props.modelValue.start, end: dateStr })
    }
  }
}

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}
function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}
</script>

<style scoped>
.date-range-calendar {
  background: rgba(255,255,255,0.02);
  border-radius: 14px;
  padding: 16px;
}
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.cal-nav-label { font-size: 14px; font-weight: 700; color: #F1F5F9; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-hd { font-size: 10px; font-weight: 700; color: #475569; text-align: center; padding: 6px 0; text-transform: uppercase; }
.cal-cell { border-radius: 8px; padding: 6px 4px; text-align: center; cursor: pointer; position: relative; transition: all 0.12s; min-height: 36px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cal-cell:hover { background: rgba(99,102,241,0.12); }
.other-month { opacity: 0.2; pointer-events: none; }
.is-past { opacity: 0.35; pointer-events: none; }
.is-holiday:hover { background: rgba(239,68,68,0.15); }
.cal-num { font-size: 12px; font-weight: 600; color: #94A3B8; line-height: 1; position: relative; z-index: 1; }
.is-holiday .cal-num { color: #EF4444; }
.is-weekend .cal-num { color: #64748B; }
.is-start .cal-num, .is-end .cal-num, .is-range .cal-num { color: #fff; }
.is-start { background: #6366F1 !important; border-radius: 8px 0 0 8px; }
.is-end { background: #6366F1 !important; border-radius: 0 8px 8px 0; }
.is-start.is-end { border-radius: 8px; }
.is-range { background: rgba(99,102,241,0.2); border-radius: 0; }
.cal-marker { width: 4px; height: 4px; border-radius: 50%; position: absolute; bottom: 3px; }
.holiday-marker { background: #EF4444; }
.weekend-marker { background: #64748B; }
.cal-selection-info { font-size: 12px; color: #6366F1; text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
</style>
