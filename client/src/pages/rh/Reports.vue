<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Reportes</h2>

    <v-card class="rounded-lg card-dark mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="3">
            <v-select v-model="filters.requestType" :items="typeOptions" label="Tipo" variant="outlined" bg-color="#111936" />
          </v-col>
          <v-col cols="12" md="3">
            <v-autocomplete v-model="filters.employeeId" :items="employees" item-title="FullName" item-value="EmployeeID" label="Empleado" clearable variant="outlined" bg-color="#111936" />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field v-model="filters.startDate" label="Desde" type="date" variant="outlined" bg-color="#111936" />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field v-model="filters.endDate" label="Hasta" type="date" variant="outlined" bg-color="#111936" />
          </v-col>
          <v-col cols="12" md="2">
            <v-select v-model="filters.pdfStatus" :items="pdfOptions" label="PDF" variant="outlined" bg-color="#111936" />
          </v-col>
        </v-row>
        <v-btn color="primary" :loading="loading" @click="generateReport">
          <v-icon start>mdi-file-chart</v-icon> Generar Reporte
        </v-btn>
      </v-card-text>
    </v-card>

    <v-card v-if="reportData.length" class="rounded-lg card-dark">
      <v-card-title class="pa-4 font-weight-bold border-b d-flex justify-space-between">
        <span>Resultados ({{ reportData.length }})</span>
        <v-btn size="small" variant="outlined" color="primary" @click="exportCSV">
          <v-icon start>mdi-download</v-icon> CSV
        </v-btn>
      </v-card-title>
      <v-table class="bg-transparent">
        <thead>
          <tr>
            <th class="text-left">ID</th>
            <th class="text-left">Empleado</th>
            <th class="text-left">Depto</th>
            <th class="text-left">Tipo</th>
            <th class="text-left">Inicio</th>
            <th class="text-left">Fin</th>
            <th class="text-left">Días</th>
            <th class="text-left">Estado</th>
            <th class="text-left">PDF</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reportData" :key="item.RequestID">
            <td>{{ item.RequestID }}</td>
            <td class="font-weight-bold">{{ item.FullName }}</td>
            <td>{{ item.Department }}</td>
            <td>
              <v-chip size="small" :color="item.RequestType === 'VACATION' ? 'primary' : 'secondary'">
                {{ item.RequestType === 'VACATION' ? 'Vacaciones' : 'Descanso' }}
              </v-chip>
            </td>
            <td>{{ formatDate(item.StartDate) }}</td>
            <td>{{ formatDate(item.EndDate) }}</td>
            <td>{{ item.DaysQuantity }}</td>
            <td>
              <v-chip size="small" :color="item.Status === 'APPROVED' ? 'success' : 'warning'">{{ item.Status }}</v-chip>
            </td>
            <td>
              <v-icon v-if="item.signed_file_path" color="success">mdi-file-pdf-box</v-icon>
              <v-icon v-else color="error">mdi-file-remove</v-icon>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const loading = ref(false)
const employees = ref<any[]>([])
const reportData = ref<any[]>([])

const filters = ref({
  requestType: 'Todos',
  employeeId: null,
  startDate: '',
  endDate: '',
  pdfStatus: 'ALL',
})

const typeOptions = ['Todos', 'Vacaciones', 'Permisos', 'Canjes']
const pdfOptions = ['ALL', 'SIGNED', 'MISSING']

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX') : '-'

const generateReport = async () => {
  loading.value = true
  try {
    const { data } = await api.post('/rh/reports/generate', filters.value)
    reportData.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const exportCSV = () => {
  const headers = ['ID,Empleado,Departamento,Tipo,Inicio,Fin,Días,Estado']
  const rows = reportData.value.map(r =>
    `${r.RequestID},"${r.FullName}","${r.Department || ''}","${r.RequestType}",${r.StartDate},${r.EndDate},${r.DaysQuantity},${r.Status}`
  )
  const csv = [...headers, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'reporte_vacaciones.csv'; a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  try {
    const { data } = await api.get('/rh/employees-list')
    employees.value = data
  } catch (err) { console.error(err) }
})
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
</style>
