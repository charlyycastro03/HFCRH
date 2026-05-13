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
        <div v-for="(stat, i) in statsCards" :key="stat.label" class="stat-card" :style="{ animationDelay: `${i * 100}ms` }" :class="`stat-card--${stat.color}`">
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
          <div class="dash-section-header"><v-icon size="18" class="mr-2">mdi-calendar-month</v-icon> Vacaciones del Mes</div>
          <div class="month-nav">
            <v-btn icon="mdi-chevron-left" size="x-small" variant="text" @click="prevMonth" />
            <span class="month-nav-label">{{ monthName }} {{ currentYear }}</span>
            <v-btn icon="mdi-chevron-right" size="x-small" variant="text" @click="nextMonth" />
          </div>
          <div v-if="monthEvents.length" class="event-list">
            <div v-for="ev in monthEvents" :key="ev.id" class="event-item">
              <div class="event-dot" :class="ev.type === 'REST_DAY' ? 'rest' : 'vacation'" />
              <div class="event-info">
                <div class="event-name">{{ ev.title }}</div>
                <div class="event-dates">
                  <v-icon size="12" class="mr-1">mdi-calendar-range</v-icon>
                  {{ formatRange(ev.start, ev.end_date || ev.end) }}
                  <span class="event-days">{{ ev.days_requested || ev.days || '' }} día(s)</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <v-icon size="32" color="#334155">mdi-calendar-blank</v-icon>
            <span>Sin vacaciones este mes</span>
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
import api from '@/api/axios'
import { useNotificationStore } from '@/stores/notification'
import Header from '@/components/layout/Header.vue'

const notification = useNotificationStore()
const stats = ref({ totalEmployees: 0, activeVacations: 0, pendingRequests: 0 })
const events = ref<any[]>([])
const birthdays = ref<any[]>([])
const loading = ref(true)
const loadError = ref('')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const monthName = computed(() => monthNames[currentMonth.value] || '')

const quickActions = [
  { label: 'Nueva Solicitud', icon: 'mdi-plus', path: '/vacaciones/solicitar', color: 'primary' },
  { label: 'Registrar Empleado', icon: 'mdi-account-plus', path: '/admin/employees', color: 'secondary' },
  { label: 'Ver Reportes', icon: 'mdi-file-chart', path: '/rh/reportes', color: 'info' },
]

const statsCards = computed(() => [
  { label: 'Total Empleados', value: stats.value.totalEmployees || 0, icon: 'mdi-account-group', color: 'primary', trend: 1 },
  { label: 'Solicitudes Firmadas', value: stats.value.activeVacations || 0, icon: 'mdi-file-check', color: 'success', trend: 1 },
  { label: 'Pendientes de Firmar', value: stats.value.pendingRequests || 0, icon: 'mdi-file-clock', color: 'warning', trend: -1 },
])

const monthEvents = computed(() => {
  const list = events.value || []
  const year = currentYear.value
  const month = currentMonth.value
  if (isNaN(year) || isNaN(month)) return []

  return list.filter((e: any) => {
    if (!e || !e.start) return false
    const s = new Date(e.start)
    return s.getFullYear() === year && s.getMonth() === month
  }).sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
})

function formatRange(start: string, end: string) {
  if (!start) return ''
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const opts: any = { day: 'numeric', month: 'short' }
  if (!e || s.getMonth() === e.getMonth()) {
    return `${s.getDate()} - ${e ? e.getDate() : '?'} ${s.toLocaleDateString('es-MX', { month: 'short' })}`
  }
  return `${s.getDate()} ${s.toLocaleDateString('es-MX', { month: 'short' })} - ${e.getDate()} ${e.toLocaleDateString('es-MX', { month: 'short' })}`
}

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
  } catch (err: any) {
    errors.push('stats')
  }

  try {
    const e = await api.get('/admin/dashboard/events')
    events.value = Array.isArray(e.data) ? e.data : []
  } catch (err: any) {
    errors.push('eventos')
  }

  try {
    const b = await api.get('/admin/birthdays')
    const list = Array.isArray(b.data) ? b.data : []
    birthdays.value = list.map((item: any) => {
      if (!item) return null
      const d = item.birth_date ? new Date(item.birth_date) : new Date()
      return {
        id: item.id,
        name: item.name || '',
        department: item.department || '',
        day: isNaN(d.getTime()) ? 0 : d.getUTCDate(),
        month: isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { month: 'short' }),
      }
    }).filter(Boolean)
  } catch (err: any) {
    errors.push('cumpleaños')
  }

  if (errors.length === 3) {
    loadError.value = 'No se pudo cargar el dashboard. Verifica conexión a BD.'
    notification.error(loadError.value)
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
.month-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.month-nav-label { font-size: 15px; font-weight: 700; color: #F1F5F9; }

.event-list { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; padding-right: 4px; }
.event-list::-webkit-scrollbar { width: 4px; }
.event-list::-webkit-scrollbar-track { background: transparent; }
.event-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

.event-item { display: flex; gap: 12px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.02); transition: background 0.15s; }
.event-item:hover { background: rgba(99,102,241,0.06); }

.event-dot { width: 8px; height: 8px; min-width: 8px; border-radius: 50%; margin-top: 6px; }
.event-dot.vacation { background: #6366F1; }
.event-dot.rest { background: #F97316; }

.event-info { flex: 1; min-width: 0; }
.event-name { font-size: 13px; font-weight: 600; color: #F1F5F9; }
.event-dates { font-size: 11px; color: #64748B; margin-top: 2px; display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.event-days { margin-left: auto; font-weight: 600; color: #6366F1; font-size: 11px; }

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
