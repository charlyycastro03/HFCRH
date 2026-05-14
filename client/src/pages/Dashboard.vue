<template>
  <div>
    <Header />

    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="40" width="3" />
      <div class="loading-text">Cargando dashboard...</div>
    </div>

    <div v-else>
      <v-alert v-if="loadError" type="error" variant="tonal" closable class="mb-4" rounded="lg" @click:close="loadError = ''">{{ loadError }}</v-alert>

      <div class="stats-grid">
        <div v-for="(stat, i) in statsCards" :key="stat.label" class="stat-card" :style="{ animationDelay: `${i * 100}ms` }" :class="`stat-card--${stat.color}`" style="cursor:pointer" @click="$router.push(stat.path)">
          <div class="stat-icon-wrap"><v-icon size="22">{{ stat.icon }}</v-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'"><v-icon size="14">{{ stat.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon></div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dash-calendar">
          <div class="dash-section-header"><v-icon size="18" class="mr-2">mdi-calendar-month</v-icon> Calendario de Ausencias</div>
          <div class="month-nav">
            <v-btn icon="mdi-chevron-left" size="x-small" variant="text" @click="prevMonth" />
            <span class="month-nav-label">{{ monthName }} {{ currentYear }}</span>
            <v-btn icon="mdi-chevron-right" size="x-small" variant="text" @click="nextMonth" />
          </div>
          <div class="cal-grid">
            <div v-for="d in dayNames" :key="d" class="cal-header-cell">{{ d }}</div>
            <div v-for="(day, i) in calendarDays" :key="i" class="cal-cell" :class="{ 'other-month': !day.isCurrent, 'is-today': day.isToday }">
              <span class="cal-num">{{ day.num }}</span>
              <div class="cal-names">
                <span v-for="(emp, ni) in day.employees.slice(0, 3)" :key="ni" class="cal-name" :class="emp.type">{{ emp.name }}</span>
                <span v-if="day.employees.length > 3" class="cal-more">+{{ day.employees.length - 3 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dash-right">
          <div class="dash-quick">
            <div class="dash-section-header"><v-icon size="18" class="mr-2">mdi-flash</v-icon> Accesos Rápidos</div>
            <div class="quick-grid">
              <v-btn v-for="q in quickActions" :key="q.label" :to="q.path" variant="tonal" :color="q.color" size="large" block rounded="xl" class="quick-btn">
                <v-icon start>{{ q.icon }}</v-icon> {{ q.label }}
              </v-btn>
            </div>
          </div>

          <div class="dash-birthdays">
            <div class="dash-section-header"><v-icon size="18" color="pink" class="mr-2">mdi-party-popper</v-icon> Cumpleaños del Mes</div>
            <div v-if="birthdays.length" class="birthday-list">
              <div v-for="b in birthdays" :key="b.id" class="birthday-item">
                <div class="birthday-date"><span class="birthday-day">{{ b.day }}</span><span class="birthday-month">{{ b.month }}</span></div>
                <div class="birthday-info"><div class="birthday-name">{{ b.name }}</div><div class="birthday-dept">{{ b.department || '' }}</div></div>
                <div class="birthday-icon"><v-icon size="16" color="pink">mdi-cake-variant</v-icon></div>
              </div>
            </div>
            <div v-else class="empty-state"><v-icon size="32" color="#334155">mdi-calendar-blank</v-icon><span>Sin cumpleaños este mes</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import Header from '@/components/layout/Header.vue'

const router = useRouter()

const stats = ref({ totalEmployees: 0, activeVacations: 0, pendingRequests: 0 })
const events = ref<any[]>([])
const birthdays = ref<any[]>([])
const loading = ref(true)
const loadError = ref('')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const monthName = computed(() => monthNames[currentMonth.value] || '')

const quickActions = [
  { label: 'Nueva Solicitud', icon: 'mdi-plus', path: '/vacaciones/solicitar', color: 'primary' },
  { label: 'Registrar Empleado', icon: 'mdi-account-plus', path: '/admin/employees', color: 'secondary' },
  { label: 'Ver Reportes', icon: 'mdi-file-chart', path: '/rh/reportes', color: 'info' },
]

const statsCards = computed(() => [
  { label: 'Total Empleados', value: stats.value.totalEmployees || 0, icon: 'mdi-account-group', color: 'primary', trend: 1, path: '/admin/employees' },
  { label: 'Solicitudes Firmadas', value: stats.value.activeVacations || 0, icon: 'mdi-file-check', color: 'success', trend: 1, path: '/vacaciones/revisar?filter=signed' },
])

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  if (isNaN(year) || isNaN(month)) return []
  const evts = Array.isArray(events.value) ? events.value : []
  const today = new Date()
  const days: any[] = []

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()

  for (let p = 0; p < startPad; p++) {
    const d = new Date(year, month, p - startPad + 1)
    days.push({ num: d.getDate(), isCurrent: false, isToday: false, employees: [] })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const employees: any[] = []
    for (const ev of evts) {
      if (!ev || !ev.start || !ev.title) continue
      const s = new Date(ev.start)
      const end = new Date(ev.end || ev.end_date)
      end.setHours(23, 59, 59, 999)
      if (date >= s && date <= end) {
        employees.push({ name: ev.title, type: ev.type === 'REST_DAY' ? 'rest' : 'vacation' })
      }
    }
    const isT = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
    days.push({ num: d, isCurrent: true, isToday: isT, employees })
  }

  const remaining = 42 - days.length
  for (let r = 0; r < remaining; r++) {
    const d = new Date(year, month + 1, r + 1)
    days.push({ num: d.getDate(), isCurrent: false, isToday: false, employees: [] })
  }

  return days
})

const prevMonth = () => {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
const nextMonth = () => {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  let errors: string[] = []

  try {
    const s = await api.get('/admin/dashboard/stats')
    stats.value = s.data || { totalEmployees: 0, activeVacations: 0, pendingRequests: 0 }
  } catch { errors.push('stats') }

  try {
    const e = await api.get('/admin/dashboard/events')
    events.value = Array.isArray(e.data) ? e.data : []
  } catch { errors.push('eventos') }

  try {
    const b = await api.get('/admin/birthdays')
    const list = Array.isArray(b.data) ? b.data : []
    birthdays.value = list.map((item: any) => {
      if (!item) return null
      const d = item.birth_date ? new Date(item.birth_date) : new Date()
      return {
        id: item.id, name: item.name || '', department: item.department || '',
        day: isNaN(d.getTime()) ? 0 : d.getUTCDate(),
        month: isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { month: 'short' }),
      }
    }).filter(Boolean)
  } catch { errors.push('cumpleaños') }

  if (errors.length === 3) {
    loadError.value = 'No se pudo cargar el dashboard. Verifica conexión a BD.'
  } else if (errors.length > 0) {
    console.warn('Dashboard parcial:', errors.join(' | '))
  }

  loading.value = false
}

onMounted(loadData)
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #1E293B; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; border: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden; animation: fadeInUp 0.5s ease both; transition: transform 0.2s, box-shadow 0.2s; }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
.stat-icon-wrap { width: 48px; height: 48px; min-width: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.stat-card--primary .stat-icon-wrap { background: rgba(99,102,241,0.15); color: #6366F1; }
.stat-card--success .stat-icon-wrap { background: rgba(34,197,94,0.15); color: #22C55E; }
.stat-card--warning .stat-icon-wrap { background: rgba(245,158,11,0.15); color: #F59E0B; }
.stat-body { flex: 1; }
.stat-value { font-size: 28px; font-weight: 700; color: #F1F5F9; line-height: 1; }
.stat-label { font-size: 12px; color: #64748B; margin-top: 4px; font-weight: 500; }
.stat-trend { position: absolute; top: 16px; right: 16px; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.stat-trend.up { background: rgba(34,197,94,0.1); color: #22C55E; }
.stat-trend.down { background: rgba(239,68,68,0.1); color: #EF4444; }

.dashboard-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
.dash-calendar, .dash-right { display: flex; flex-direction: column; gap: 20px; }
.dash-calendar, .dash-quick, .dash-birthdays { background: #1E293B; border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); }
.dash-section-header { font-size: 14px; font-weight: 600; color: #F1F5F9; margin-bottom: 16px; display: flex; align-items: center; }
.month-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.month-nav-label { font-size: 15px; font-weight: 700; color: #F1F5F9; }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.cal-header-cell { font-size: 10px; font-weight: 700; color: #475569; text-align: center; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.5px; }
.cal-cell { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 4px; min-height: 62px; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.06); transition: background 0.15s; }
.cal-cell:hover { background: rgba(99,102,241,0.08); }
.other-month { opacity: 0.2; }
.is-today { background: rgba(99,102,241,0.15) !important; border-color: #6366F1 !important; }
.cal-num { font-size: 11px; font-weight: 700; color: #CBD5E1; line-height: 1; margin-bottom: 3px; }
.is-today .cal-num { color: #A5B4FC; }
.cal-names { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.cal-name { font-size: 9px; padding: 2px 5px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; font-weight: 600; }
.cal-name.vacation { background: rgba(99,102,241,0.35); color: #C7D2FE; }
.cal-name.rest { background: rgba(251,146,60,0.35); color: #FED7AA; }
.cal-more { font-size: 9px; color: #64748B; padding: 1px 4px; font-weight: 700; }

.quick-grid { display: flex; flex-direction: column; gap: 8px; }
.quick-btn { height: 44px !important; font-weight: 600; justify-content: flex-start; }
.quick-btn :deep(.v-btn__content) { width: 100%; justify-content: flex-start; }
.birthday-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.birthday-item:last-child { border-bottom: none; }
.birthday-date { width: 36px; text-align: center; flex-shrink: 0; }
.birthday-day { font-size: 20px; font-weight: 700; color: #F1F5F9; line-height: 1; display: block; }
.birthday-month { font-size: 10px; color: #64748B; text-transform: uppercase; }
.birthday-info { flex: 1; min-width: 0; }
.birthday-name { font-size: 13px; font-weight: 600; color: #F1F5F9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.birthday-dept { font-size: 11px; color: #64748B; }
.birthday-icon { flex-shrink: 0; }
.empty-state { text-align: center; padding: 32px 20px; color: #475569; font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 16px; }
.loading-text { font-size: 13px; color: #64748B; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1100px) { .dashboard-grid { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr; } .stat-value { font-size: 22px; } }
</style>
