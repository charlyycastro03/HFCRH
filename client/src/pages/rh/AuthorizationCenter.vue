<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Centro de Autorizaciones</h2>

    <v-card class="rounded-lg card-dark">
      <v-card-title class="pa-4 font-weight-bold border-b d-flex align-center">
        <v-icon class="mr-2" color="warning">mdi-clock-outline</v-icon>
        Solicitudes Pendientes ({{ pending.length }})
      </v-card-title>

      <v-table class="bg-transparent">
        <thead>
          <tr>
            <th class="text-left">Empleado</th>
            <th class="text-left">Departamento</th>
            <th class="text-left">Tipo</th>
            <th class="text-left">Inicio</th>
            <th class="text-left">Fin</th>
            <th class="text-left">Días</th>
            <th class="text-left">Comentarios</th>
            <th class="text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pending" :key="item.id">
            <td class="font-weight-bold">{{ item.EmployeeName }}</td>
            <td>{{ item.department }}</td>
            <td>
              <v-chip size="small" :color="item.RequestType === 'VACATION' ? 'primary' : 'secondary'">
                {{ item.RequestType === 'VACATION' ? 'Vacaciones' : 'Descanso' }}
              </v-chip>
            </td>
            <td>{{ formatDate(item.start_date) }}</td>
            <td>{{ formatDate(item.end_date) }}</td>
            <td>{{ item.days_requested }}</td>
            <td class="text-caption text-truncate" style="max-width: 150px;">{{ item.comments || '-' }}</td>
            <td>
              <v-btn icon="mdi-check" color="success" size="small" class="mr-1" @click="action(item.id, 'APPROVE')" />
              <v-btn icon="mdi-close" color="error" size="small" @click="action(item.id, 'REJECT')" />
            </td>
          </tr>
          <tr v-if="!pending.length">
            <td colspan="8" class="text-center text-medium-emphasis py-6">No hay solicitudes pendientes</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-card class="rounded-lg card-dark mt-4">
      <v-card-title class="pa-4 font-weight-bold border-b">
        <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
        Historial de Autorización
      </v-card-title>
      <v-table class="bg-transparent">
        <thead>
          <tr>
            <th class="text-left">Empleado</th>
            <th class="text-left">Tipo</th>
            <th class="text-left">Inicio</th>
            <th class="text-left">Fin</th>
            <th class="text-left">Días</th>
            <th class="text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in history" :key="item.id">
            <td class="font-weight-bold">{{ item.EmployeeName }}</td>
            <td>
              <v-chip size="small" :color="item.RequestType === 'VACATION' ? 'primary' : 'secondary'">
                {{ item.RequestType === 'VACATION' ? 'Vacaciones' : 'Descanso' }}
              </v-chip>
            </td>
            <td>{{ formatDate(item.start_date) }}</td>
            <td>{{ formatDate(item.end_date) }}</td>
            <td>{{ item.days_requested }}</td>
            <td>
              <v-chip size="small" :color="item.status === 'APPROVED' ? 'success' : 'error'">{{ item.status }}</v-chip>
            </td>
          </tr>
          <tr v-if="!history.length">
            <td colspan="6" class="text-center text-medium-emphasis py-6">Sin historial</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import { useNotificationStore } from '@/stores/notification'

const notification = useNotificationStore()
const pending = ref<any[]>([])
const history = ref<any[]>([])

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX') : '-'

const loadData = async () => {
  try {
    const { data } = await api.get('/rh/authorization/dashboard')
    pending.value = data.filter((r: any) => r.status === 'PENDING')
    history.value = data.filter((r: any) => r.status !== 'PENDING')
  } catch (err) {
    console.error(err)
  }
}

const action = async (requestId: number, actionType: string) => {
  try {
    await api.post('/rh/authorization/action', { requestId, action: actionType })
    notification.success(actionType === 'APPROVE' ? 'Solicitud aprobada' : 'Solicitud rechazada')
    await loadData()
  } catch (err: any) {
    notification.error(err.response?.data?.message || 'Error al procesar')
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
</style>
