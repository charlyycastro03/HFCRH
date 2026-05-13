<template>
  <div>
    <Header />

    <div class="section-title">
      <v-icon size="20" class="mr-2">mdi-account-tie</v-icon>
      Gestión de Empleados
      <v-spacer />
      <div class="search-box">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Buscar empleado..."
          density="compact"
          hide-details
          rounded="xl"
          bg-color="#1E293B"
          class="search-input"
        />
      </div>
      <v-btn color="primary" rounded="xl" @click="openDialog()">
        <v-icon start size="18">mdi-plus</v-icon>
        Nuevo
      </v-btn>
    </div>

    <v-card class="main-card">
      <v-card-text class="pa-0">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Departamento</th>
                <th>Fecha Ingreso</th>
                <th>Días Disp.</th>
                <th>Jornada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in filteredEmployees" :key="emp.id">
                <td class="name-cell">{{ emp.name }}</td>
                <td>{{ emp.department || '—' }}</td>
                <td>{{ formatDate(emp.hire_date) }}</td>
                <td class="days-cell">
                  <span class="days-chip" :class="daysClass(emp.vacation_days_available)">
                    {{ emp.vacation_days_available }}
                  </span>
                </td>
                <td>{{ emp.work_days_per_week }} días/sem</td>
                <td class="actions-cell">
                  <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(emp)" />
                  <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(emp)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="560">
      <v-card rounded="xl" class="form-card">
        <div class="form-title">{{ formTitle }}</div>
        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="editedItem.name" label="Nombre completo" prepend-inner-icon="mdi-account" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="editedItem.department" label="Departamento" prepend-inner-icon="mdi-domain" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="editedItem.hire_date" label="Fecha de ingreso" type="date" prepend-inner-icon="mdi-calendar" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="editedItem.birth_date" label="Fecha nacimiento" type="date" prepend-inner-icon="mdi-calendar-heart" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model.number="editedItem.work_days_per_week"
                :items="[5,6,7]"
                label="Días por semana"
                prepend-inner-icon="mdi-calendar-week"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="editedItem.vacation_days_available"
                label="Días disponibles"
                type="number"
                prepend-inner-icon="mdi-counter"
              />
            </v-col>
            <v-col cols="12">
              <v-switch
                v-model="editedItem.es_arquitecto"
                label="Arquitecto"
                color="primary"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" rounded="xl" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="xl" :loading="saving" @click="save">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl" class="delete-card">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="error" class="mb-3">mdi-alert-circle</v-icon>
          <div class="delete-title">{{ itemToDelete?.name }}</div>
          <div class="delete-sub">¿Eliminar este empleado? Esta acción es irreversible.</div>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 justify-center">
          <v-btn variant="text" rounded="xl" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" rounded="xl" :loading="deleting" @click="deleteEmployee">
            <v-icon start size="16">mdi-delete</v-icon>
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useNotificationStore } from '@/stores/notification'
import Header from '@/components/layout/Header.vue'

const notification = useNotificationStore()
const employees = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const editedIndex = ref(-1)
const editedItem = ref<any>({ name: '', department: '', hire_date: null, birth_date: null, vacation_days_available: 0, work_days_per_week: 6, es_arquitecto: false })
const itemToDelete = ref<any>(null)

const filteredEmployees = computed(() => {
  if (!search.value) return employees.value
  const t = search.value.toLowerCase()
  return employees.value.filter(e => e.name?.toLowerCase().includes(t) || e.department?.toLowerCase().includes(t))
})

const formTitle = computed(() => editedIndex.value === -1 ? 'Nuevo Empleado' : 'Editar Empleado')

const formatDate = (d: string) => {
  if (!d) return '—'
  const date = new Date(d)
  return `${date.getUTCDate().toString().padStart(2,'0')}/${(date.getUTCMonth()+1).toString().padStart(2,'0')}/${date.getUTCFullYear()}`
}

const daysClass = (d: number) => {
  if (d <= 0) return 'zero'
  if (d <= 4) return 'low'
  if (d <= 10) return 'mid'
  return 'high'
}

const fetchEmployees = async () => {
  loading.value = true
  try { const { data } = await api.get('/admin/employees'); employees.value = data }
  finally { loading.value = false }
}

const openDialog = (item?: any) => {
  if (item) {
    editedIndex.value = employees.value.indexOf(item)
    editedItem.value = {
      ...item,
      es_arquitecto: item.es_arquitecto === 1 || item.es_arquitecto === true,
      hire_date: item.hire_date ? new Date(item.hire_date).toISOString().split('T')[0] : null,
      birth_date: item.birth_date ? new Date(item.birth_date).toISOString().split('T')[0] : null,
    }
  } else {
    editedIndex.value = -1
    editedItem.value = { name: '', department: '', hire_date: null, birth_date: null, vacation_days_available: 0, work_days_per_week: 6, es_arquitecto: false }
  }
  dialog.value = true
}

const save = async () => {
  if (!editedItem.value.name) return
  saving.value = true
  try {
    if (editedIndex.value > -1) {
      await api.put(`/admin/employees/${editedItem.value.id}`, editedItem.value)
    } else {
      await api.post('/admin/employees', editedItem.value)
    }
    dialog.value = false
    await fetchEmployees()
    notification.success('Empleado guardado correctamente')
  } catch (e: any) {
    notification.error(e.response?.data?.msg || 'Error al guardar')
  } finally { saving.value = false }
}

const confirmDelete = (item: any) => { itemToDelete.value = item; deleteDialog.value = true }

const deleteEmployee = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await api.delete(`/admin/employees/${itemToDelete.value.id}`)
    deleteDialog.value = false
    await fetchEmployees()
    notification.success('Empleado eliminado')
  } catch (e: any) {
    notification.error(e.response?.data?.msg || 'Error al eliminar')
  } finally { deleting.value = false }
}

onMounted(fetchEmployees)
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #F1F5F9;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box { flex: 1; max-width: 300px; }
.search-input { font-size: 13px; }

.main-card, .form-card, .delete-card {
  background: #1E293B !important;
  border: 1px solid rgba(255,255,255,0.05) !important;
  border-radius: 16px !important;
}

.table-wrapper { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  padding: 14px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.data-table tbody tr {
  transition: background 0.15s;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: rgba(99,102,241,0.05); }

.data-table tbody td {
  padding: 14px 20px;
  font-size: 13px;
  color: #94A3B8;
}

.name-cell { font-weight: 600; color: #F1F5F9 !important; }
.days-cell { font-weight: 700 !important; }
.actions-cell { white-space: nowrap; }

.days-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.days-chip.high { background: rgba(34,197,94,0.12); color: #22C55E; }
.days-chip.mid { background: rgba(245,158,11,0.12); color: #F59E0B; }
.days-chip.low { background: rgba(239,68,68,0.12); color: #EF4444; }
.days-chip.zero { background: rgba(71,85,105,0.2); color: #64748B; }

.form-title {
  font-size: 18px;
  font-weight: 700;
  color: #F1F5F9;
  padding: 24px 24px 8px;
}

.delete-title { font-size: 16px; font-weight: 700; color: #F1F5F9; margin-bottom: 8px; }
.delete-sub { font-size: 13px; color: #64748B; }

@media (max-width: 600px) {
  .search-box { max-width: 100%; }
  .data-table { font-size: 12px; }
  .data-table thead th, .data-table tbody td { padding: 10px 12px; }
}
</style>