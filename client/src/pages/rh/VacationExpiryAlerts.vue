<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Alertas de Vencimiento</h2>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg" color="error-darken-3">
          <v-card-text class="pa-4 text-center">
            <div class="text-h3 font-weight-bold">{{ alerts.critical.length }}</div>
            <div class="text-caption">Críticas (&le;7 días)</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg" color="warning-darken-3">
          <v-card-text class="pa-4 text-center">
            <div class="text-h3 font-weight-bold">{{ alerts.urgent.length }}</div>
            <div class="text-caption">Urgentes (&le;15 días)</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-lg" color="info-darken-3">
          <v-card-text class="pa-4 text-center">
            <div class="text-h3 font-weight-bold">{{ alerts.warning.length }}</div>
            <div class="text-caption">Próximas (&le;30 días)</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="rounded-lg card-dark mt-4">
      <v-card-title class="pa-4 font-weight-bold border-b">Detalle de Alertas</v-card-title>
      <v-table class="bg-transparent">
        <thead>
          <tr>
            <th class="text-left">Empleado</th>
            <th class="text-left">Depto</th>
            <th class="text-left">Período</th>
            <th class="text-left">Días Restantes</th>
            <th class="text-left">Vence</th>
            <th class="text-left">Días por Vencer</th>
            <th class="text-left">Nivel</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in allAlerts" :key="item.period_id">
            <td class="font-weight-bold">{{ item.employee_name }}</td>
            <td>{{ item.department }}</td>
            <td>{{ item.period_year }}</td>
            <td>{{ item.days_remaining }}</td>
            <td>{{ formatDate(item.expiry_date) }}</td>
            <td>
              <v-chip :color="item.days_until_expiry <= 7 ? 'error' : item.days_until_expiry <= 15 ? 'warning' : 'info'" size="small">
                {{ item.days_until_expiry }} días
              </v-chip>
            </td>
            <td>
              <v-chip size="small" :color="alertColor(item.alert_level)">{{ item.alert_level }}</v-chip>
            </td>
          </tr>
          <tr v-if="!allAlerts.length">
            <td colspan="7" class="text-center text-medium-emphasis py-6">No hay alertas</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

const alerts = ref<any>({ critical: [], urgent: [], warning: [] })

const allAlerts = computed(() => [...alerts.value.critical, ...alerts.value.urgent, ...alerts.value.warning])

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX') : '-'
const alertColor = (l: string) => l === 'critical' ? 'error' : l === 'urgent' ? 'warning' : 'info'

const loadData = async () => {
  try {
    const { data } = await api.get('/vacations/alerts')
    alerts.value = data.data
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
