<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Mis Vacaciones</h2>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg card-dark">
          <v-card-text class="pa-4 text-center">
            <div class="text-caption text-medium-emphasis">Días Disponibles</div>
            <div class="text-h2 font-weight-bold text-primary">{{ stats.BalanceCurrentPeriod }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg card-dark">
          <v-card-text class="pa-4 text-center">
            <div class="text-caption text-medium-emphasis">Total Tomados</div>
            <div class="text-h2 font-weight-bold text-orange">{{ history.filter(h => h.status === 'APPROVED').reduce((a, b) => a + b.days_requested, 0) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg card-dark">
          <v-card-text class="pa-4 text-center">
            <div class="text-caption text-medium-emphasis">Departamento</div>
            <div class="text-h6 font-weight-bold text-white">{{ stats.Department || '-' }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="rounded-lg card-dark mt-4">
      <v-card-title class="pa-4 font-weight-bold border-b">Historial de Solicitudes</v-card-title>
      <v-table class="bg-transparent">
        <thead>
          <tr>
            <th class="text-left">Tipo</th>
            <th class="text-left">Inicio</th>
            <th class="text-left">Fin</th>
            <th class="text-left">Días</th>
            <th class="text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in history" :key="item.id">
            <td>
              <v-chip size="small" :color="item.type === 'VACATION' ? 'primary' : 'secondary'">
                {{ item.type === 'VACATION' ? 'Vacaciones' : 'Descanso' }}
              </v-chip>
            </td>
            <td>{{ formatDate(item.start_date) }}</td>
            <td>{{ formatDate(item.end_date) }}</td>
            <td>{{ item.days_requested }}</td>
            <td>
              <v-chip size="small" :color="statusColor(item.status)">{{ item.status }}</v-chip>
            </td>
          </tr>
          <tr v-if="!history.length">
            <td colspan="5" class="text-center text-medium-emphasis">Sin solicitudes</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const stats = ref<any>({ BalanceCurrentPeriod: 0, Department: '' })
const history = ref<any[]>([])

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX') : '-'
const statusColor = (s: string) => s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : 'warning'

const loadData = async () => {
  try {
    const { data } = await api.get('/rh/my-vacations')
    stats.value = data.stats
    history.value = data.history
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
</style>
