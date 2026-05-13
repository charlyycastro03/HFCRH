<template>
  <div>
    <Header />

    <div class="section-title">
      <v-icon size="20" class="mr-2">mdi-file-chart</v-icon>
      Reportes de Vacaciones
    </div>

    <v-card class="main-card">
      <v-card-text class="pa-5">
        <div class="filters-bar">
          <v-select
            v-model="filters.requestType"
            :items="typeOptions"
            label="Tipo"
            density="compact"
            hide-details
            class="filter-select"
          />
          <v-autocomplete
            v-model="filters.employeeId"
            :items="employees"
            item-title="FullName"
            item-value="EmployeeID"
            label="Empleado"
            clearable
            density="compact"
            hide-details
            class="filter-select"
          />
          <v-text-field
            v-model="filters.startDate"
            label="Desde"
            type="date"
            density="compact"
            hide-details
            class="filter-date"
          />
          <v-text-field
            v-model="filters.endDate"
            label="Hasta"
            type="date"
            density="compact"
            hide-details
            class="filter-date"
          />
          <v-select
            v-model="filters.pdfStatus"
            :items="pdfOptions"
            label="PDF"
            density="compact"
            hide-details
            class="filter-select"
          />
          <v-btn
            color="primary"
            :loading="loading"
            rounded="lg"
            @click="generateReport"
          >
            <v-icon start>mdi-magnify</v-icon>
            Generar
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card v-if="reportData.length" class="main-card mt-4">
      <v-card-text class="pa-0">
        <div class="table-toolbar">
          <div class="result-count">
            <v-icon size="16" class="mr-1">mdi-table</v-icon>
            {{ reportData.length }} resultado{{ reportData.length !== 1 ? 's' : '' }}
          </div>
          <div class="table-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              rounded="lg"
              @click="exportExcel"
            >
              <v-icon start size="16">mdi-microsoft-excel</v-icon>
              Exportar Excel
            </v-btn>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Tipo</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Días</th>
                <th>Estado</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in reportData" :key="item.RequestID">
                <td class="folio">#{{ item.RequestID }}</td>
                <td class="name">{{ item.FullName }}</td>
                <td class="dept">{{ item.Department || '-' }}</td>
                <td>
                  <span class="type-badge" :class="item.RequestType === 'VACATION' ? 'vacation' : 'rest'">
                    {{ item.RequestType === 'VACATION' ? 'Vacaciones' : 'Descanso' }}
                  </span>
                </td>
                <td>{{ formatDate(item.StartDate) }}</td>
                <td>{{ formatDate(item.EndDate) }}</td>
                <td class="days">{{ item.DaysQuantity }}</td>
                <td>
                  <span class="status-badge" :class="item.Status.toLowerCase()">
                    {{ item.Status }}
                  </span>
                </td>
                <td>
                  <v-icon v-if="item.signed_file_path" color="success" size="18">mdi-file-check</v-icon>
                  <v-icon v-else color="#475569" size="18">mdi-file-question</v-icon>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="!reportData.length && !hasSearched" class="empty-state">
      <v-icon size="64" color="#334155">mdi-file-chart-outline</v-icon>
      <div class="empty-title">Sin datos</div>
      <div class="empty-sub">Aplica filtros y genera un reporte</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'
import Header from '@/components/layout/Header.vue'

const loading = ref(false)
const hasSearched = ref(false)
const employees = ref<any[]>([])
const reportData = ref<any[]>([])

const filters = reactive({
  requestType: 'Todos',
  employeeId: null as number | null,
  startDate: '',
  endDate: '',
  pdfStatus: 'ALL',
})

const typeOptions = ['Todos', 'Vacaciones', 'Permisos', 'Canjes']
const pdfOptions = ['ALL', 'SIGNED', 'MISSING']

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const generateReport = async () => {
  loading.value = true
  hasSearched.value = true
  try {
    const { data } = await api.post('/rh/reports/generate', filters)
    reportData.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const exportExcel = () => {
  if (!reportData.value.length) return
  import('xlsx').then(XLSX => {
    const wsData = [
      ['FOLIO', 'EMPLEADO', 'DEPARTAMENTO', 'TIPO', 'INICIO', 'FIN', 'DÍAS', 'ESTADO', 'PDF'],
      ...reportData.value.map((r: any) => [
        r.RequestID,
        r.FullName,
        r.Department || '',
        r.RequestType === 'VACATION' ? 'Vacaciones' : 'Descanso',
        r.StartDate,
        r.EndDate,
        r.DaysQuantity,
        r.Status,
        r.signed_file_path ? 'Sí' : 'No',
      ])
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vacaciones')
    ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 6 }]
    XLSX.writeFile(wb, `reporte_vacaciones_${new Date().toISOString().split('T')[0]}.xlsx`)
  })
}

onMounted(async () => {
  try { const { data } = await api.get('/rh/employees-list'); employees.value = data }
  catch (e) { console.error(e) }
})
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #F1F5F9;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.main-card {
  background: #1E293B !important;
  border: 1px solid rgba(255,255,255,0.05) !important;
  border-radius: 16px !important;
}

.filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select { max-width: 160px; }
.filter-date { max-width: 140px; }

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.result-count {
  font-size: 13px;
  color: #64748B;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.table-wrapper { overflow-x: auto; }

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table thead th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  white-space: nowrap;
}

.report-table tbody tr {
  transition: background 0.15s;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

.report-table tbody tr:hover {
  background: rgba(99,102,241,0.06);
}

.report-table tbody tr:last-child { border-bottom: none; }

.report-table tbody td {
  padding: 14px 16px;
  font-size: 13px;
  color: #94A3B8;
  white-space: nowrap;
}

.folio { font-weight: 700; color: #6366F1 !important; font-size: 12px !important; }
.name { font-weight: 600; color: #F1F5F9 !important; }
.days { font-weight: 700; color: #F1F5F9 !important; }

.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge.vacation { background: rgba(99,102,241,0.12); color: #818CF8; }
.type-badge.rest { background: rgba(249,115,22,0.12); color: #FB923C; }

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.approved { background: rgba(34,197,94,0.12); color: #22C55E; }
.status-badge.pending { background: rgba(245,158,11,0.12); color: #F59E0B; }
.status-badge.rejected { background: rgba(239,68,68,0.12); color: #EF4444; }

.empty-state {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-title { font-size: 18px; font-weight: 600; color: #475569; }
.empty-sub { font-size: 13px; color: #334155; }

@media (max-width: 960px) {
  .filters-bar { flex-direction: column; align-items: stretch; }
  .filter-select, .filter-date { max-width: 100%; }
}
</style>