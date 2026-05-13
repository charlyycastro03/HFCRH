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
              <div class="d-flex justify-space-between mb-3">
                <div>
                  <div class="font-weight-bold">{{ employeeInfo.name }}</div>
                  <div class="text-caption">{{ employeeInfo.es_arquitecto ? 'Arquitecto' : 'Colaborador' }}</div>
                </div>
                <v-chip color="primary">Días: {{ employeeInfo.total_days_available }}</v-chip>
              </div>
              <v-row dense>
                <v-col cols="4"><span class="text-caption">Ingreso: {{ formatDate(employeeInfo.hire_date) }}</span></v-col>
                <v-col cols="4"><span class="text-caption">Ley: {{ employeeInfo.entitlement_days }} días/año</span></v-col>
                <v-col cols="4"><span class="text-caption">Jornada: {{ employeeInfo.work_days_per_week }} días/sem</span></v-col>
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
                <v-text-field v-model="startDate" label="Desde" type="date" variant="outlined" bg-color="#111936" @change="calculate" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="endDate" label="Hasta" type="date" variant="outlined" bg-color="#111936" @change="calculate" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="calculatedDays" label="Días a Descontar" readonly variant="solo-filled" bg-color="#111936" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="returnDate" label="Regreso a Labores" readonly variant="solo-filled" bg-color="#111936" />
              </v-col>
            </v-row>

            <v-textarea v-model="comments" label="Comentarios" variant="outlined" rows="2" bg-color="#111936" class="mt-2" />

            <v-btn block color="primary" size="large" class="mt-4" :loading="submitting" :disabled="!calculatedDays" @click="submit">
              <v-icon start>mdi-send</v-icon> Generar Solicitud
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="rounded-lg card-dark">
          <v-card-title class="pa-4 font-weight-bold border-b">Historial Reciente</v-card-title>
          <v-list v-if="history.length" bg-color="transparent">
            <v-list-item v-for="item in history" :key="item.id" class="border-b">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="36">
                  <v-icon>mdi-calendar-range</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2 font-weight-bold">
                {{ formatShort(item.start_date) }} - {{ formatShort(item.end_date) }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ item.days_requested }} días | {{ item.status }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div v-else class="pa-4 text-center text-caption text-medium-emphasis">Sin historial</div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '-'
const formatShort = (d: string) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '-'

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
    returnDate.value = new Date(data.return_date).toLocaleDateString()
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
      status: 'APPROVED',
      comments: comments.value,
      type: requestType.value,
    })
    notification.success('Solicitud creada con éxito')
    await loadEmployeeInfo()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.msg || 'Error al crear solicitud'
    notification.error(errorMsg.value)
  } finally {
    submitting.value = false
  }
}

onMounted(loadEmployees)
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
.cursor-pointer { cursor: pointer; }
</style>
