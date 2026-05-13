<template>
  <div>
    <h1 class="text-h4 font-weight-bold text-white mb-1">Panel Principal</h1>
    <p class="text-body-1 text-medium-emphasis mb-6">Resumen general de HFC Construcciones</p>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="overflow-hidden" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <v-card-text class="text-white pa-6">
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-caption font-weight-medium opacity-75">Total Empleados</div>
                <div class="text-h3 font-weight-bold">{{ stats.totalEmployees || 0 }}</div>
              </div>
              <v-avatar color="white" variant="tonal" size="50" rounded>
                <v-icon size="30">mdi-account-group</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="overflow-hidden" style="background: linear-gradient(to right, #00b09b, #96c93d);">
          <v-card-text class="text-white pa-6">
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-caption font-weight-medium opacity-75">Vacaciones Firmadas</div>
                <div class="text-h3 font-weight-bold">{{ stats.activeVacations || 0 }}</div>
              </div>
              <v-avatar color="white" variant="tonal" size="50" rounded>
                <v-icon size="30">mdi-file-check</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="overflow-hidden" style="background: linear-gradient(to right, #ff5f6d, #ffc371);">
          <v-card-text class="text-white pa-6">
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-caption font-weight-medium opacity-75">Faltan Firmas</div>
                <div class="text-h3 font-weight-bold">{{ stats.pendingRequests || 0 }}</div>
              </div>
              <v-avatar color="white" variant="tonal" size="50" rounded>
                <v-icon size="30">mdi-file-alert</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card class="rounded-lg card-dark">
          <v-card-title class="pa-4 d-flex justify-space-between align-center border-b">
            <span class="font-weight-bold">Calendario de Ausencias</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row v-for="(week, wi) in calendarMatrix" :key="wi" no-gutters>
              <v-col v-for="(day, di) in week" :key="di" cols="12/7" class="pa-1 text-center" :class="{ 'text-medium-emphasis': !day.isCurrent }">
                <div class="text-caption mb-1" :class="{ 'font-weight-bold text-primary': isToday(day.date) }">
                  {{ day.num }}
                </div>
                <div v-for="ev in day.events" :key="ev.id">
                  <v-chip color="primary" size="x-small" class="text-truncate" style="max-width: 100%;">
                    {{ ev.title }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="rounded-lg card-dark mb-4">
          <v-card-title class="pa-4 font-weight-bold border-b">Accesos Rápidos</v-card-title>
          <v-card-text class="pa-4">
            <v-btn block color="primary" class="mb-3" to="/vacaciones/solicitar">
              <v-icon start>mdi-plus</v-icon> Nueva Solicitud
            </v-btn>
            <v-btn block color="secondary" class="mb-3" to="/admin/employees">
              <v-icon start>mdi-account-plus</v-icon> Registrar Empleado
            </v-btn>
            <v-btn block color="info" to="/admin/users">
              <v-icon start>mdi-account-cog</v-icon> Gestionar Usuarios
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card class="rounded-lg card-dark">
          <v-card-title class="pa-4 font-weight-bold border-b">
            <v-icon color="pink" class="mr-2">mdi-party-popper</v-icon>
            Próximos Cumpleaños
          </v-card-title>
          <v-card-text class="pa-4">
            <div v-if="birthdays.length">
              <v-list-item v-for="b in birthdays" :key="b.id" class="px-0">
                <template v-slot:prepend>
                  <v-avatar size="32" color="pink" class="mr-2">{{ b.day }}</v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">{{ b.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ b.department }}</v-list-item-subtitle>
              </v-list-item>
            </div>
            <div v-else class="text-center py-4 text-medium-emphasis text-caption">
              No hay cumpleaños este mes
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import type { DashboardStats, CalendarEvent } from '@/types'

const stats = ref<DashboardStats>({ totalEmployees: 0, activeVacations: 0, pendingRequests: 0 })
const events = ref<CalendarEvent[]>([])
const birthdays = ref<any[]>([])
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const loadData = async () => {
  try {
    const [s, e, b] = await Promise.all([
      api.get('/admin/dashboard/stats'),
      api.get('/admin/dashboard/events'),
      api.get('/admin/birthdays'),
    ])
    stats.value = s.data
    events.value = e.data
    birthdays.value = b.data
  } catch (err) {
    console.error(err)
  }
}

const isToday = (d: Date) => {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

const calendarMatrix = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const start = new Date(firstDay)
  start.setDate(start.getDate() - start.getDay())
  const rows: any[] = []
  let cur = new Date(start)

  for (let w = 0; w < 6; w++) {
    const week: any[] = []
    for (let d = 0; d < 7; d++) {
      const dayEvents = events.value.filter((e) => {
        const s = new Date(e.start)
        const en = new Date(e.end)
        s.setHours(0, 0, 0, 0)
        en.setHours(0, 0, 0, 0)
        const c = new Date(cur)
        c.setHours(0, 0, 0, 0)
        return c >= s && c <= en
      })
      week.push({ num: cur.getDate(), date: new Date(cur), isCurrent: cur.getMonth() === currentMonth.value, events: dayEvents })
      cur.setDate(cur.getDate() + 1)
    }
    rows.push(week)
    if (cur > lastDay && cur.getDay() === 0) break
  }
  return rows
})

onMounted(loadData)
</script>

<style scoped>
.card-dark {
  background: #1A223F !important;
  border: 1px solid #2e3852;
}
.border-b {
  border-bottom: 1px solid #2e3852;
}
</style>
