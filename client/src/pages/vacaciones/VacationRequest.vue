<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Solicitar Vacaciones</h2>
    <v-row>
      <v-col cols="12" md="8">
        <v-card class="rounded-lg card-dark">
          <v-card-title class="bg-primary pa-4 text-white font-weight-bold">Nueva Solicitud</v-card-title>
          <v-card-text class="pa-4">
            <v-alert v-if="successMsg" type="success" closable class="mb-4" @click:close="successMsg = ''">{{ successMsg }}</v-alert>
            <v-alert v-if="errorMsg" type="error" closable class="mb-4" @click:close="errorMsg = ''">{{ errorMsg }}</v-alert>

            <v-autocomplete v-model="selectedEmployeeId" :items="employees" item-title="name" item-value="id" label="Seleccionar Colaborador" variant="outlined" bg-color="#111936" class="mb-4" @update:model-value="loadEmployeeInfo" />

            <v-sheet v-if="employeeInfo" class="pa-4 rounded-lg mb-4" color="primary" variant="tonal">
              <div class="d-flex justify-space-between align-center mb-3">
                <div>
                  <div class="font-weight-bold text-h6">{{ employeeInfo.name }}</div>
                  <div class="text-caption">{{ employeeInfo.position || (employeeInfo.es_arquitecto ? 'Arquitecto' : 'Colaborador') }}</div>
                </div>
                <v-chip color="primary" size="large">{{ daysRemaining }} días disponibles</v-chip>
              </div>
              <v-row dense>
                <v-col cols="3">
                  <div class="text-caption text-medium-emphasis">Fecha Ingreso</div>
                  <div class="font-weight-bold">{{ formatDate(employeeInfo.hire_date) }}</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-caption text-medium-emphasis">Antigüedad</div>
                  <div class="font-weight-bold">{{ seniority }}</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-caption text-medium-emphasis">Días de Ley</div>
                  <div class="font-weight-bold">{{ employeeInfo.entitlement_days }} días/año</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-caption text-medium-emphasis">Jornada</div>
                  <div class="font-weight-bold">{{ employeeInfo.work_days_per_week }} días/sem</div>
                </v-col>
              </v-row>
              <v-divider class="my-2" color="primary" />
              <v-row dense>
                <v-col cols="4" class="text-center">
                  <div class="text-caption text-medium-emphasis">Disponibles</div>
                  <div class="text-h6 font-weight-bold text-white">{{ employeeInfo.total_days_available }}</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-caption text-medium-emphasis">Usados</div>
                  <div class="text-h6 font-weight-bold text-orange">{{ employeeInfo.total_days_used }}</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-caption text-medium-emphasis">Total Período</div>
                  <div class="text-h6 font-weight-bold text-white">{{ employeeInfo.entitlement_days }}</div>
                </v-col>
              </v-row>
            </v-sheet>

            <v-item-group v-if="employeeInfo?.es_arquitecto" v-model="requestType" mandatory class="mb-4">
              <v-row>
                <v-col cols="6">
                  <v-item v-slot="{ isSelected, toggle }" value="VACATION">
                    <v-card :color="isSelected ? 'primary' : ''" :variant="isSelected ? 'flat' : 'outlined'" class="pa-3 text-center cursor-pointer" @click="toggle">
                      <v-icon :color="isSelected ? 'white' : 'primary'" size="28">mdi-beach</v-icon>
                      <div class="text-body-2 font-weight-bold">Vacaciones</div>
                    </v-card>
                  </v-item>
                </v-col>
                <v-col cols="6">
                  <v-item v-slot="{ isSelected, toggle }" value="REST_DAY">
                    <v-card :color="isSelected ? 'secondary' : ''" :variant="isSelected ? 'flat' : 'outlined'" class="pa-3 text-center cursor-pointer" @click="toggle">
                      <v-icon :color="isSelected ? 'white' : 'secondary'" size="28">mdi-briefcase-off</v-icon>
                      <div class="text-body-2 font-weight-bold">Descanso</div>
                    </v-card>
                  </v-item>
                </v-col>
              </v-row>
            </v-item-group>

            <v-row>
              <v-col cols="6">
                <v-text-field v-model="startDate" label="Desde" type="date" variant="outlined" bg-color="#111936" @change="calculate" :min="minDate" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="endDate" label="Hasta" type="date" variant="outlined" bg-color="#111936" @change="calculate" :min="startDate || minDate" />
              </v-col>
              <v-col cols="4">
                <v-text-field v-model="calculatedDays" label="Días a Descontar" readonly variant="solo-filled" bg-color="#111936" />
              </v-col>
              <v-col cols="4">
                <v-text-field :model-value="daysRemaining" label="Saldo después" readonly variant="solo-filled" bg-color="#111936" :color="daysRemaining < 0 ? 'error' : ''" />
              </v-col>
              <v-col cols="4">
                <v-text-field v-model="returnDate" label="Regreso a Labores" readonly variant="solo-filled" bg-color="#111936" />
              </v-col>
            </v-row>

            <v-textarea v-model="comments" label="Comentarios / Motivo" variant="outlined" rows="2" bg-color="#111936" class="mt-2" />

            <v-btn block color="primary" size="large" class="mt-4" :loading="submitting" :disabled="!canSubmit" @click="submit">
              <v-icon start>mdi-send</v-icon> Generar Solicitud
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="rounded-lg card-dark">
          <v-card-title class="pa-4 font-weight-bold border-b">
            <v-icon class="mr-1">mdi-history</v-icon>
            Solicitudes ({{ history.length }})
          </v-card-title>
          <v-list v-if="history.length" bg-color="transparent" style="max-height: 600px; overflow-y: auto;">
              <v-list-item v-for="item in history" :key="item.id" class="border-b py-2" :title="formatDateShort(item.start_date) + ' - ' + formatDateShort(item.end_date)">
              <template v-slot:prepend>
                <v-avatar :color="item.type === 'VACATION' ? 'primary' : 'secondary'" variant="tonal" size="36">
                  <v-icon>{{ item.type === 'VACATION' ? 'mdi-beach' : 'mdi-briefcase-off' }}</v-icon>
                </v-avatar>
              </template>
              <template v-slot:subtitle>
                <v-chip size="x-small" :color="statusColor(item.status)" class="mr-1">{{ item.status }}</v-chip>
                {{ item.days_requested }} días
              </template>
              <template v-slot:append>
                <div class="d-flex ga-1">
                  <v-tooltip text="Imprimir" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-printer" variant="text" size="x-small" color="info" @click="printRequest(item)" />
                    </template>
                  </v-tooltip>
                  <v-tooltip text="Subir PDF firmado" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :icon="item.signed_file_path ? 'mdi-file-pdf-box' : 'mdi-upload'" variant="text" size="x-small" :color="item.signed_file_path ? 'success' : 'warning'" @click="uploadPdf(item)" />
                    </template>
                  </v-tooltip>
                  <v-tooltip text="Eliminar" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-delete" variant="text" size="x-small" color="error" @click="confirmDelete(item)" />
                    </template>
                  </v-tooltip>
                </div>
              </template>
              <div v-if="item.comments" class="text-caption text-medium-emphasis mt-1">{{ item.comments }}</div>
            </v-list-item>
          </v-list>
          <div v-else class="pa-4 text-center text-caption text-medium-emphasis">Selecciona un empleado para ver sus solicitudes</div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-lg card-dark">
        <v-card-title class="bg-error pa-4 text-white font-weight-bold">Confirmar Eliminación</v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-2">¿Eliminar solicitud de <strong>{{ deleteItem?.employee_name }}</strong>?</p>
          <p class="text-caption text-medium-emphasis">
            {{ formatDateShort(deleteItem?.start_date) }} - {{ formatDateShort(deleteItem?.end_date) }} ({{ deleteItem?.days_requested }} días)
          </p>
          <p v-if="deleteItem?.status === 'APPROVED'" class="text-warning text-caption mt-2">
            Los días se reembolsarán al empleado.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteItemConfirm">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <input ref="fileInput" type="file" accept=".pdf" style="display:none" @change="handleFileUpload" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useNotificationStore } from '@/stores/notification'

const notification = useNotificationStore()
const employees = ref<any[]>([])
const selectedEmployeeId = ref<number | null>(null)
const employeeInfo = ref<any>(null)
const history = ref<any[]>([])
const requestType = ref('VACATION')
const startDate = ref('')
const endDate = ref('')
const calculatedDays = ref(0)
const returnDate = ref('')
const comments = ref('')
const submitting = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const deleteDialog = ref(false)
const deleteItem = ref<any>(null)
const deleting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadTarget = ref<any>(null)

const minDate = computed(() => new Date().toISOString().split('T')[0])

const daysRemaining = computed(() => {
  if (!employeeInfo.value) return 0
  const available = Number(employeeInfo.value.total_days_available) || 0
  const requesting = Number(calculatedDays.value) || 0
  return available - requesting
})

const canSubmit = computed(() => {
  return selectedEmployeeId.value && startDate.value && endDate.value && calculatedDays.value > 0 && daysRemaining.value >= 0
})

const seniority = computed(() => {
  if (!employeeInfo.value?.hire_date) return '-'
  const hire = new Date(employeeInfo.value.hire_date)
  const now = new Date()
  let years = now.getFullYear() - hire.getFullYear()
  const m = now.getMonth() - hire.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) years--
  if (years <= 0) {
    const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth())
    return `${months} meses`
  }
  return `${years} años`
})

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
const formatDateShort = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '-'
const statusColor = (s: string) => s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : 'warning'

const loadEmployees = async () => {
  const { data } = await api.get('/admin/employees')
  employees.value = data
}

const loadEmployeeInfo = async () => {
  if (!selectedEmployeeId.value) return
  try {
    const { data } = await api.get(`/vacations/employee/${selectedEmployeeId.value}/summary`)
    employeeInfo.value = data.data || data
    const { data: hist } = await api.get(`/vacations/requests/${selectedEmployeeId.value}`)
    history.value = hist
    successMsg.value = ''
    errorMsg.value = ''
  } catch (err) {
    console.error(err)
  }
}

const calculate = async () => {
  if (!startDate.value || !endDate.value || !selectedEmployeeId.value) return
  try {
    const { data } = await api.post('/vacations/calculate', {
      employeeId: selectedEmployeeId.value,
      startDate: startDate.value,
      endDate: endDate.value,
    })
    calculatedDays.value = data.days_requested
    returnDate.value = new Date(data.return_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch (err) {
    console.error(err)
  }
}

const submit = async () => {
  if (!selectedEmployeeId.value || !calculatedDays.value) return
  submitting.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await api.post('/vacations/requests', {
      employee_id: selectedEmployeeId.value,
      request_date: new Date().toISOString().split('T')[0],
      start_date: startDate.value,
      end_date: endDate.value,
      days_requested: calculatedDays.value,
      return_date: returnDate.value,
      status: 'PENDING',
      comments: comments.value,
      type: requestType.value,
    })
    notification.success('Solicitud creada con éxito')
    startDate.value = ''
    endDate.value = ''
    calculatedDays.value = 0
    returnDate.value = ''
    comments.value = ''
    await loadEmployeeInfo()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.msg || 'Error al crear solicitud'
    notification.error(errorMsg.value)
  } finally {
    submitting.value = false
  }
}

const printRequest = (item: any) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(`
    <html>
    <head>
      <title>Solicitud #${item.id} - HFC Construcciones</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1565C0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1565C0; margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 5px 0 0; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .info-table td { padding: 10px 15px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 180px; color: #555; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 4px; font-weight: bold; font-size: 14px; }
        .status-APPROVED { background: #e8f5e9; color: #2e7d32; }
        .status-PENDING { background: #fff3e0; color: #e65100; }
        .status-REJECTED { background: #ffebee; color: #c62828; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-primary { background: #1565C0; color: white; }
        .badge-secondary { background: #6A1B9A; color: white; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HFC Construcciones</h1>
        <p>Solicitud de ${item.type === 'VACATION' ? 'Vacaciones' : 'Día de Descanso'}</p>
      </div>
      <table class="info-table">
        <tr><td>Folio:</td><td>#${item.id}</td></tr>
        <tr><td>Empleado:</td><td><strong>${item.employee_name}</strong></td></tr>
        <tr><td>Fecha de Solicitud:</td><td>${formatDate(item.request_date)}</td></tr>
        <tr><td>Período:</td><td>${formatDateShort(item.start_date)} - ${formatDateShort(item.end_date)}</td></tr>
        <tr><td>Días Solicitados:</td><td>${item.days_requested}</td></tr>
        <tr><td>Tipo:</td><td><span class="badge ${item.type === 'VACATION' ? 'badge-primary' : 'badge-secondary'}">${item.type === 'VACATION' ? 'Vacaciones' : 'Descanso'}</span></td></tr>
        <tr><td>Estado:</td><td><span class="status-badge status-${item.status}">${item.status}</span></td></tr>
        ${item.comments ? `<tr><td>Motivo:</td><td>${item.comments}</td></tr>` : ''}
      </table>
      <div style="margin-top: 40px;">
        <div style="display: inline-block; margin-right: 60px; text-align: center;">
          <div style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px; width: 200px;"></div>
          <div style="font-size: 12px; color: #666;">Firma del Colaborador</div>
        </div>
        <div style="display: inline-block; text-align: center;">
          <div style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px; width: 200px;"></div>
          <div style="font-size: 12px; color: #666;">Firma de Autorización</div>
        </div>
      </div>
      <div class="footer">
        <p>Sistema RH - HFC Construcciones | ${new Date().toLocaleDateString('es-MX')}</p>
      </div>
      <script>
        window.onload = function() { window.print(); window.close(); }
      <\\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

const uploadPdf = (item: any) => {
  uploadTarget.value = item
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !uploadTarget.value) return

  const file = input.files[0]
  if (file.type !== 'application/pdf') {
    notification.error('Solo se permiten archivos PDF')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    notification.error('El archivo excede el límite de 5 MB')
    return
  }

  try {
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      await api.post(`/vacations/requests/${uploadTarget.value.id}/upload`, { fileBase64: base64 })
      notification.success('PDF subido correctamente')
      uploadTarget.value = null
      await loadEmployeeInfo()
    }
    reader.onerror = () => {
      notification.error('Error al leer el archivo')
    }
    reader.readAsDataURL(file)
  } catch (err: any) {
    notification.error(err.response?.data?.msg || 'Error al subir PDF')
  }

  input.value = ''
}

const confirmDelete = (item: any) => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deleteItemConfirm = async () => {
  if (!deleteItem.value) return
  deleting.value = true
  try {
    await api.delete(`/vacations/requests/${deleteItem.value.id}`)
    notification.success('Solicitud eliminada')
    deleteDialog.value = false
    deleteItem.value = null
    await loadEmployeeInfo()
  } catch (err: any) {
    notification.error(err.response?.data?.msg || 'Error al eliminar')
  } finally {
    deleting.value = false
  }
}

onMounted(loadEmployees)
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
.cursor-pointer { cursor: pointer; }
</style>
