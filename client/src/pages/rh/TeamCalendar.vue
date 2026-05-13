<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Calendario del Equipo</h2>

    <v-card class="rounded-lg card-dark mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <v-btn icon variant="text" @click="prevMonth">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <span class="text-h6 font-weight-bold">{{ monthName }} {{ currentYear }}</span>
          <v-btn icon variant="text" @click="nextMonth">
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="rounded-lg card-dark">
      <v-table class="bg-transparent">
        <thead>
          <tr>
            <th class="text-center" v-for="d in dayNames" :key="d">{{ d }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(week, wi) in calendarMatrix" :key="wi">
            <td v-for="(day, di) in week" :key="di" class="pa-1 text-center" style="vertical-align: top; height: 90px; width: 14.28%;"
              :class="{ 'text-medium-emphasis': !day.isCurrent, 'bg-primary-darken': isToday(day.date) }">
              <div class="text-caption mb-1" :class="{ 'font-weight-bold text-primary': isToday(day.date) }">
                {{ day.num }}
              </div>
              <div v-for="ev in day.events" :key="ev.id" class="mb-1">
                <v-chip color="primary" size="x-small" class="text-truncate" style="max-width: 100%;">
                  {{ ev.employee_name }}
                </v-chip>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

const events = ref<any[]>([])
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const monthName = computed(() => monthNames[currentMonth.value])

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
        const s = new Date(e.start_date)
        const en = new Date(e.end_date)
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

const prevMonth = () => {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
const nextMonth = () => {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

const loadData = async () => {
  try {
    const { data } = await api.get('/rh/calendar-events')
    events.value = data
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
.bg-primary-darken { background: rgba(99, 91, 255, 0.08); }
</style>
