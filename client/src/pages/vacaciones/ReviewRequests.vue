<template>
  <div>
    <Header />
    <div class="section-title">
      <v-icon size="20" class="mr-2">{{ filter === 'signed' ? 'mdi-file-pdf-box' : 'mdi-file-clock' }}</v-icon>
      {{ filter === 'signed' ? 'Solicitudes Completas (PDF)' : 'Pendientes de Firma' }}
    </div>
    <v-card class="main-card">
      <v-card-text class="pa-0">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Período</th>
                <th>Días</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in requests" :key="r.id">
                <td class="name-cell">{{ r.employee_name }}</td>
                <td>{{ r.department || '—' }}</td>
                <td>{{ fmtDate(r.start_date) }} — {{ fmtDate(r.end_date) }}</td>
                <td class="days-cell">{{ r.days_requested }}</td>
                <td><v-chip size="x-small" :color="r.signed_file_path ? 'success' : 'warning'" variant="tonal">{{ r.signed_file_path ? 'Listo' : 'Pendiente' }}</v-chip></td>
                <td><v-btn size="x-small" variant="text" color="primary" @click="goToRequest(r)">Ver solicitud</v-btn></td>
              </tr>
              <tr v-if="!requests.length">
                <td colspan="6" class="empty-cell">Sin solicitudes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>
    <div class="btn-back">
      <v-btn variant="text" rounded="xl" @click="$router.push('/dashboard')">
        <v-icon start>mdi-arrow-left</v-icon> Volver al dashboard
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios'
import Header from '@/components/layout/Header.vue'

const route = useRoute()
const router = useRouter()
const filter = ref((route.query.filter as string) === 'signed' ? 'signed' : 'pending')
const requests = ref<any[]>([])

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function goToRequest(r: any) {
  router.push(`/vacaciones/solicitar?employeeId=${r.employee_id}`)
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/vacations/review?filter=${filter.value}`)
    requests.value = data || []
  } catch { requests.value = [] }
})
</script>

<style scoped>
.section-title { font-size: 16px; font-weight: 600; color: #F1F5F9; margin-bottom: 16px; display: flex; align-items: center; }
.main-card { background: #1E293B !important; border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 16px !important; }
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead th { padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.data-table tbody tr { transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.03); }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: rgba(99,102,241,0.05); }
.data-table tbody td { padding: 14px 20px; font-size: 13px; color: #94A3B8; }
.name-cell { font-weight: 600; color: #F1F5F9 !important; cursor: pointer; }
.name-cell:hover { color: #6366F1 !important; }
.days-cell { font-weight: 700; }
.empty-cell { text-align: center; color: #475569; padding: 40px !important; }
.btn-back { margin-top: 16px; }
</style>
