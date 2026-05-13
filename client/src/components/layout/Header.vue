<template>
  <v-app-bar elevation="0" class="px-4" style="background: #1A223F !important; border-bottom: 1px solid #2e3852;">
    <v-app-bar-title class="text-h6 font-weight-bold">
      {{ title }}
    </v-app-bar-title>
    <v-spacer />
    <v-chip variant="tonal" color="primary" size="small" class="mr-2">
      {{ userRole }}
    </v-chip>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const title = computed(() => {
  const name = route.name?.toString() || ''
  const titles: Record<string, string> = {
    Dashboard: 'Panel Principal',
    UserManagement: 'Gestión de Usuarios',
    EmployeeManagement: 'Gestión de Empleados',
    VacationRequest: 'Solicitar Vacaciones',
    MyVacations: 'Mis Vacaciones',
    AuthorizationCenter: 'Centro de Autorizaciones',
    TeamCalendar: 'Calendario del Equipo',
    Reports: 'Reportes',
    VacationAlerts: 'Alertas de Vacaciones',
  }
  return titles[name] || name
})

const userRole = computed(() => {
  const r = authStore.user?.role
  if (r === 'admin') return 'Admin'
  if (r === 'hr') return 'RH'
  return 'User'
})
</script>
