<template>
  <div>
    <Header />
    <v-row>
      <v-col cols="12" xl="8">
        <div class="section-title">
          <v-icon size="20" class="mr-2">mdi-calendar-check</v-icon>
          Nueva Solicitud
        </div>

        <v-card class="main-card">
          <v-card-text class="pa-6">
            <v-alert
              v-if="successMsg"
              type="success"
              variant="tonal"
              closable
              class="mb-4"
              rounded="lg"
              @click:close="successMsg = ''"
            >{{ successMsg }}</v-alert>
            <v-alert
              v-if="errorMsg"
              type="error"
              variant="tonal"
              closable
              class="mb-4"
              rounded="lg"
              @click:close="errorMsg = ''"
            >{{ errorMsg }}</v-alert>

            <v-autocomplete
              v-model="selectedEmployeeId"
              :items="employees"
              item-title="name"
              item-value="id"
              label="Seleccionar colaborador"
              prepend-inner-icon="mdi-account-search"
              clearable
              class="mb-4"
              @update:model-value="loadEmployeeInfo"
            />

            <Transition name="expand">
              <div v-if="employeeInfo" class="employee-card">
                <div class="employee-left">
                  <div class="employee-name">{{ employeeInfo.name }}</div>
                  <div class="employee-dept">{{ employeeInfo.department || 'Sin departamento' }}</div>
                  <div class="employee-meta">
                    <span><v-icon size="14">mdi-calendar-account</v-icon> {{ formatDate(employeeInfo.hire_date) }}</span>
                    <span><v-icon size="14">mdi-clock-outline</v-icon> {{ seniority }}</span>
                  </div>
                </div>
                <div class="employee-right">
                  <div class="days-available">
                    <div class="days-number" :style="{ color: daysColor }">{{ daysRemaining }}</div>
                    <div class="days-label">días disp.</div>
                  </div>
                </div>
              </div>
            </Transition>

            <Transition name="expand">
              <div v-if="employeeInfo" class="balance-grid">
                <div class="balance-item">
                  <div class="balance-value" style="color: #22C55E">{{ employeeInfo.total_days_available }}</div>
                  <div class="balance-label">Disponibles</div>
                </div>
                <div class="balance-item">
                  <div class="balance-value" style="color: #F97316">{{ employeeInfo.total_days_used }}</div>
                  <div class="balance-label">Usados</div>
                </div>
                <div class="balance-item">
                  <div class="balance-value">{{ employeeInfo.entitlement_days }}</div>
                  <div class="balance-label">Total Ley</div>
                </div>
                <div class="balance-item">
                  <div class="balance-value">{{ employeeInfo.work_days_per_week }}</div>
                  <div class="balance-label">Días/Sem</div>
                </div>
              </div>
            </Transition>

            <v-item-group v-if="employeeInfo?.es_arquitecto" v-model="requestType" mandatory class="type-toggle mb-4">
              <div class="toggle-label">Tipo de solicitud</div>
              <div class="toggle-row">
                <v-item v-slot="{ isSelected, toggle }" value="VACATION">
                  <div
                    class="toggle-option"
                    :class="{ active: isSelected }"
                    @click="toggle"
                  >
                    <v-icon size="20" class="mb-1">{{ isSelected ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                    Vacaciones
                  </div>
                </v-item>
                <v-item v-slot="{ isSelected, toggle }" value="REST_DAY">
                  <div
                    class="toggle-option"
                    :class="{ active: isSelected }"
                    @click="toggle"
                  >
                    <v-icon size="20" class="mb-1">{{ isSelected ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                    Día de Descanso
                  </div>
                </v-item>
              </div>
            </v-item-group>

            <div v-if="employeeInfo" class="form-section">
              <div class="form-row">
                <v-text-field
                  v-model="startDate"
                  label="Fecha inicio"
                  type="date"
                  :min="minDate"
                  @update:model-value="calculate"
                  prepend-inner-icon="mdi-calendar-start"
                />
                <v-text-field
                  v-model="endDate"
                  label="Fecha fin"
                  type="date"
                  :min="startDate || minDate"
                  @update:model-value="calculate"
                  prepend-inner-icon="mdi-calendar-end"
                />
              </div>
              <div class="form-row">
                <v-text-field
                  :model-value="calculatedDays"
                  label="Días a tomar"
                  readonly
                  prepend-inner-icon="mdi-counter"
                  bg-color="#334155"
                />
                <v-text-field
                  :model-value="daysRemaining"
                  label="Saldo después"
                  readonly
                  prepend-inner-icon="mdi-wallet-outline"
                  bg-color="#334155"
                  :color="daysRemaining < 0 ? 'error' : 'success'"
                />
                <v-text-field
                  v-model="returnDate"
                  label="Regreso"
                  readonly
                  prepend-inner-icon="mdi-calendar-check"
                  bg-color="#334155"
                />
              </div>
            </div>

            <v-textarea
              v-if="employeeInfo"
              v-model="comments"
              label="Comentarios o motivo (opcional)"
              prepend-inner-icon="mdi-text"
              rows="2"
              class="mt-3"
            />

            <v-btn
              block
              color="primary"
              size="x-large"
              :loading="submitting"
              :disabled="!canSubmit"
              rounded="xl"
              class="mt-4 submit-btn"
              @click="submit"
            >
              <v-icon start>mdi-send</v-icon>
              Enviar Solicitud
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" xl="4">
        <div class="section-title">
          <v-icon size="20" class="mr-2">mdi-history</v-icon>
          Solicitudes Recientes
          <v-chip size="x-small" class="ml-2" color="primary" variant="tonal">{{ history.length }}</v-chip>
        </div>

        <div class="history-list">
          <TransitionGroup name="list">
            <div
              v-for="item in history"
              :key="item.id"
              class="history-card"
            >
              <div class="history-header">
                <div class="history-type">
                  <v-icon size="14" :color="item.type === 'VACATION' ? 'primary' : 'secondary'">
                    {{ item.type === 'VACATION' ? 'mdi-beach' : 'mdi-briefcase-off' }}
                  </v-icon>
                  <span>{{ item.type === 'VACATION' ? 'Vacaciones' : 'Descanso' }}</span>
                </div>
                <v-chip size="x-small" :color="statusColor(item.status)" variant="tonal">
                  {{ statusLabel(item.status) }}
                </v-chip>
              </div>

              <div class="history-dates">
                <v-icon size="14" class="mr-1">mdi-calendar-range</v-icon>
                {{ formatShort(item.start_date) }} — {{ formatShort(item.end_date) }}
                <span class="history-days">{{ item.days_requested }} días</span>
              </div>

              <div v-if="item.comments" class="history-comments">{{ item.comments }}</div>

              <div class="history-actions">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="info"
                  @click="printRequest(item)"
                >
                  <v-icon size="14" class="mr-1">mdi-printer</v-icon>
                  Imprimir
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="text"
                  :color="item.signed_file_path ? 'success' : 'warning'"
                  @click="uploadPdf(item)"
                >
                  <v-icon size="14" class="mr-1">
                    {{ item.signed_file_path ? 'mdi-file-pdf-box' : 'mdi-upload' }}
                  </v-icon>
                  {{ item.signed_file_path ? 'PDF' : 'Subir' }}
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(item)"
                >
                  <v-icon size="14" class="mr-1">mdi-delete</v-icon>
                  Eliminar
                </v-btn>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="!history.length && employeeInfo" class="empty-history">
            <v-icon size="40" color="#334155">mdi-calendar-blank</v-icon>
            <div>Sin solicitudes aún</div>
          </div>

          <div v-if="!selectedEmployeeId" class="empty-history">
            <v-icon size="40" color="#334155">mdi-account-search</v-icon>
            <div>Selecciona un colaborador para ver sus solicitudes</div>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="xl" class="delete-dialog">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="error" class="mb-3">mdi-alert-circle</v-icon>
          <div class="delete-title">¿Eliminar solicitud?</div>
          <div class="delete-info">
            {{ formatShort(deleteItem?.start_date) }} — {{ formatShort(deleteItem?.end_date) }}
            ({{ deleteItem?.days_requested }} días)
          </div>
          <div v-if="deleteItem?.status === 'APPROVED'" class="delete-warning">
            Los días serán reembolsados al empleado.
          </div>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" block rounded="xl" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" block rounded="xl" :loading="deleting" @click="deleteItemConfirm">
            <v-icon start size="16">mdi-delete</v-icon>
            Eliminar
          </v-btn>
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
import Header from '@/components/layout/Header.vue'

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
  return (Number(employeeInfo.value.total_days_available) || 0) - (Number(calculatedDays.value) || 0)
})

const daysColor = computed(() => {
  const d = daysRemaining.value
  if (d <= 0) return '#EF4444'
  if (d <= 4) return '#EF4444'
  if (d <= 10) return '#F59E0B'
  return '#22C55E'
})

const canSubmit = computed(() =>
  selectedEmployeeId.value && startDate.value && endDate.value && calculatedDays.value > 0 && daysRemaining.value >= 0
)

const seniority = computed(() => {
  if (!employeeInfo.value?.hire_date) return '-'
  const hire = new Date(employeeInfo.value.hire_date)
  const now = new Date()
  let years = now.getFullYear() - hire.getFullYear()
  const m = now.getMonth() - hire.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) years--
  if (years <= 0) {
    const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth())
    return `${Math.max(1, months)} meses`
  }
  return `${years} años`
})

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
const formatShort = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '-'
const statusColor = (s: string) => s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : 'warning'
const statusLabel = (s: string) => s === 'APPROVED' ? 'Aprobada' : s === 'REJECTED' ? 'Rechazada' : 'Pendiente'

const loadEmployees = async () => {
  try { const { data } = await api.get('/admin/employees'); employees.value = data }
  catch (e) { console.error(e) }
}

const loadEmployeeInfo = async () => {
  if (!selectedEmployeeId.value) { employeeInfo.value = null; history.value = []; return }
  try {
    const { data } = await api.get(`/vacations/employee/${selectedEmployeeId.value}/summary`)
    employeeInfo.value = data.data || data
    const { data: hist } = await api.get(`/vacations/requests/${selectedEmployeeId.value}`)
    history.value = hist
    successMsg.value = ''; errorMsg.value = ''
  } catch (e) { console.error(e) }
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
  } catch (e) { console.error(e) }
}

const submit = async () => {
  if (!selectedEmployeeId.value || !calculatedDays.value) return
  submitting.value = true; successMsg.value = ''; errorMsg.value = ''
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
    notification.success('Solicitud enviada correctamente')
    startDate.value = ''; endDate.value = ''; calculatedDays.value = 0
    returnDate.value = ''; comments.value = ''
    await loadEmployeeInfo()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.msg || 'Error al crear solicitud'
    notification.error(errorMsg.value)
  } finally { submitting.value = false }
}

const printRequest = (item: any) => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Solicitud #${item.id} - HFC</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;padding:48px;background:#fff;color:#1a1a2e}
.header{text-align:center;border-bottom:3px solid #6366F1;padding-bottom:24px;margin-bottom:32px}
.header h1{font-size:28px;color:#6366F1;letter-spacing:4px;margin-bottom:4px}
.header p{color:#666;font-size:13px}
.separator{height:2px;background:linear-gradient(90deg,#6366F1,#F97316);margin:24px 0;border:none}
.info-table{width:100%;border-collapse:collapse;margin-bottom:28px}
.info-table td{padding:12px 16px;border-bottom:1px solid #eee}
.info-table td:first-child{font-weight:600;color:#555;width:160px;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
.info-table td:last-child{color:#1a1a2e;font-size:14px}
.badge{display:inline-block;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600}
.badge-APPROVED{background:#dcfce7;color:#16a34a}.badge-PENDING{background:#fef3c7;color:#d97706}.badge-REJECTED{background:#fee2e2;color:#dc2626}
.badge-VACATION{background:#ede9fe;color:#7c3aed}.badge-REST{background:#fae8ff;color:#a21caf}
.signatures{display:flex;gap:48px;margin-top:40px}
.sig-block{text-align:center;flex:1}
.sig-line{border-bottom:1px solid #333;padding-bottom:48px;margin-bottom:8px}
.sig-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px}
.footer{text-align:center;margin-top:40px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:11px}
@media print{body{padding:24px}}
</style></head><body>
<div class="header">
  <h1>HFC CONSTRUCCIONES</h1>
  <p>Solicitud de ${item.type === 'VACATION' ? 'Vacaciones' : 'Día de Descanso'} · Sistema de Gestión RH</p>
</div>
<table class="info-table">
  <tr><td>Folio</td><td>#${item.id}</td></tr>
  <tr><td>Empleado</td><td><strong>${item.employee_name}</strong></td></tr>
  <tr><td>Fecha Solicitud</td><td>${new Date(item.request_date).toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
  <tr><td>Período</td><td>${new Date(item.start_date).toLocaleDateString('es-MX')} — ${new Date(item.end_date).toLocaleDateString('es-MX')}</td></tr>
  <tr><td>Días</td><td>${item.days_requested}</td></tr>
  <tr><td>Tipo</td><td><span class="badge badge-${item.type === 'VACATION' ? 'VACATION' : 'REST'}">${item.type === 'VACATION' ? 'Vacaciones' : 'Día de Descanso'}</span></td></tr>
  <tr><td>Estado</td><td><span class="badge badge-${item.status}">${statusLabel(item.status)}</span></td></tr>
  ${item.comments ? `<tr><td>Motivo</td><td>${item.comments}</td></tr>` : ''}
</table>
<hr class="separator">
<div class="signatures">
  <div class="sig-block">
    <div class="sig-line"></div>
    <div class="sig-label">Firma del Colaborador</div>
  </div>
  <div class="sig-block">
    <div class="sig-line"></div>
    <div class="sig-label">Vo.Bo. Recursos Humanos</div>
  </div>
</div>
<div class="footer">
  <p>Portal RH · HFC Construcciones · Generado: ${new Date().toLocaleDateString('es-MX')} · Folio #${item.id}</p>
</div>
<script>window.onload=function(){window.print();window.close()}<\/script></body></html>`)
  printWindow.document.close()
}

const uploadPdf = (item: any) => { uploadTarget.value = item; fileInput.value?.click() }

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !uploadTarget.value) return
  const file = input.files[0]
  if (file.type !== 'application/pdf') { notification.error('Solo archivos PDF'); return }
  if (file.size > 5 * 1024 * 1024) { notification.error('Máx. 5 MB'); return }
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      await api.post(`/vacations/requests/${uploadTarget.value.id}/upload`, { fileBase64: reader.result })
      notification.success('PDF subido correctamente')
      uploadTarget.value = null
      await loadEmployeeInfo()
    } catch (e: any) { notification.error(e.response?.data?.msg || 'Error al subir') }
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const confirmDelete = (item: any) => { deleteItem.value = item; deleteDialog.value = true }

const deleteItemConfirm = async () => {
  if (!deleteItem.value) return
  deleting.value = true
  try {
    await api.delete(`/vacations/requests/${deleteItem.value.id}`)
    notification.success('Solicitud eliminada')
    deleteDialog.value = false
    deleteItem.value = null
    await loadEmployeeInfo()
  } catch (e: any) { notification.error(e.response?.data?.msg || 'Error al eliminar') }
  finally { deleting.value = false }
}

onMounted(loadEmployees)
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
  border-radius: 20px !important;
}

.employee-card {
  background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(249,115,22,0.08));
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.employee-name {
  font-size: 18px;
  font-weight: 700;
  color: #F1F5F9;
}

.employee-dept {
  font-size: 13px;
  color: #64748B;
  margin-top: 2px;
}

.employee-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #64748B;
  align-items: center;
}

.employee-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.days-available {
  text-align: center;
}

.days-number {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
}

.days-label {
  font-size: 11px;
  color: #64748B;
  margin-top: 2px;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.balance-item {
  text-align: center;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 12px 8px;
}

.balance-value {
  font-size: 20px;
  font-weight: 700;
  color: #F1F5F9;
}

.balance-label {
  font-size: 11px;
  color: #64748B;
  margin-top: 2px;
}

.type-toggle {
  margin-bottom: 20px;
}

.toggle-label {
  font-size: 12px;
  color: #64748B;
  margin-bottom: 8px;
  font-weight: 500;
}

.toggle-row {
  display: flex;
  gap: 10px;
}

.toggle-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: #64748B;
  transition: all 0.2s;
}

.toggle-option:hover {
  background: rgba(99,102,241,0.08);
  border-color: rgba(99,102,241,0.3);
  color: #F1F5F9;
}

.toggle-option.active {
  background: rgba(99,102,241,0.15);
  border-color: #6366F1;
  color: #6366F1;
}

.form-section { margin-top: 16px; }

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.submit-btn {
  height: 52px !important;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-right: 4px;
}

.history-list::-webkit-scrollbar { width: 4px; }
.history-list::-webkit-scrollbar-track { background: transparent; }
.history-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

.history-card {
  background: #1E293B;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.2s;
}

.history-card:hover {
  border-color: rgba(99,102,241,0.3);
  transform: translateX(-2px);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-type {
  font-size: 12px;
  font-weight: 600;
  color: #94A3B8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-dates {
  font-size: 13px;
  color: #F1F5F9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-days {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: #6366F1;
}

.history-comments {
  font-size: 12px;
  color: #64748B;
  margin-top: 6px;
  font-style: italic;
}

.history-actions {
  display: flex;
  gap: 4px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.04);
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #475569;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.delete-dialog { background: #1E293B !important; }
.delete-title { font-size: 18px; font-weight: 700; color: #F1F5F9; margin-bottom: 8px; }
.delete-info { font-size: 13px; color: #94A3B8; margin-bottom: 8px; }
.delete-warning { font-size: 12px; color: #F59E0B; background: rgba(245,158,11,0.1); padding: 8px 12px; border-radius: 8px; margin-top: 8px; }

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 500px; }

.list-enter-active, .list-leave-active { transition: all 0.3s; }
.list-enter-from { opacity: 0; transform: translateX(20px); }
.list-leave-to { opacity: 0; transform: translateX(-20px); }

@media (max-width: 960px) {
  .form-row { grid-template-columns: 1fr; }
  .balance-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>