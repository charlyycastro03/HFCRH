<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Gestión de Empleados</h2>
    <v-card class="rounded-lg card-dark">
      <v-card-title class="pa-4 d-flex justify-space-between align-center border-b">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Buscar..." variant="outlined" density="compact" hide-details style="max-width: 300px;" bg-color="#111936" />
        <v-btn color="primary" @click="openDialog()"><v-icon start>mdi-plus</v-icon> Nuevo</v-btn>
      </v-card-title>
      <v-data-table :headers="headers" :items="filteredEmployees" :loading="loading" class="bg-transparent">
        <template v-slot:item.hire_date="{ item }">{{ item.hire_date ? formatDate(item.hire_date) : '-' }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" color="info" class="mr-1" @click="openDialog(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="600">
      <v-card class="rounded-lg card-dark">
        <v-card-title class="border-b pa-4 bg-primary text-white">{{ formTitle }}</v-card-title>
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="editedItem.name" label="Nombre" variant="outlined" bg-color="#111936" :rules="[v => !!v || 'Requerido']" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="editedItem.department" label="Departamento" variant="outlined" bg-color="#111936" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="editedItem.hire_date" label="Fecha Ingreso" type="date" variant="outlined" bg-color="#111936" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="editedItem.birth_date" label="Fecha Nacimiento" type="date" variant="outlined" bg-color="#111936" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="editedItem.vacation_days_available" label="Días Disponibles" type="number" variant="outlined" bg-color="#111936" />
            </v-col>
            <v-col cols="6">
              <v-select v-model.number="editedItem.work_days_per_week" :items="[5,6,7]" label="Días/Semana" variant="outlined" bg-color="#111936" />
            </v-col>
            <v-col cols="12">
              <v-switch v-model="editedItem.es_arquitecto" label="¿Es Arquitecto?" color="primary" inset :true-value="true" :false-value="false" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="border-t pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-lg card-dark">
        <v-card-title class="bg-error text-white pa-4">Eliminar Empleado</v-card-title>
        <v-card-text class="pa-6 text-center">
          <p class="font-weight-bold mb-2">{{ itemToDelete?.name }}</p>
          <p class="text-caption text-medium-emphasis">Esta acción es irreversible.</p>
        </v-card-text>
        <v-card-actions class="border-t pa-4 justify-center">
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="deleteEmployee" :loading="deleting">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import type { Employee } from '@/types'

const employees = ref<Employee[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const editedIndex = ref(-1)
const editedItem = ref<any>({ name: '', department: '', hire_date: null, birth_date: null, vacation_days_available: 0, work_days_per_week: 6, es_arquitecto: false })
const itemToDelete = ref<any>(null)

const headers = [
  { title: 'Nombre', key: 'name' },
  { title: 'Departamento', key: 'department' },
  { title: 'Fecha Ingreso', key: 'hire_date' },
  { title: 'Días Disp.', key: 'vacation_days_available', align: 'center' as const },
  { title: 'Días/Sem', key: 'work_days_per_week', align: 'center' as const },
  { title: 'Acciones', key: 'actions', sortable: false },
]

const filteredEmployees = computed(() => {
  if (!search.value) return employees.value
  const t = search.value.toLowerCase()
  return employees.value.filter(e => e.name?.toLowerCase().includes(t) || e.department?.toLowerCase().includes(t))
})

const formTitle = computed(() => editedIndex.value === -1 ? 'Nuevo Empleado' : 'Editar Empleado')

const formatDate = (d: string) => {
  const date = new Date(d)
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`
}

const fetchEmployees = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/employees')
    employees.value = data
  } finally {
    loading.value = false
  }
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
  } catch (err: any) {
    alert(err.response?.data?.msg || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: any) => {
  itemToDelete.value = item
  deleteDialog.value = true
}

const deleteEmployee = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await api.delete(`/admin/employees/${itemToDelete.value.id}`)
    deleteDialog.value = false
    await fetchEmployees()
  } finally {
    deleting.value = false
    itemToDelete.value = null
  }
}

onMounted(fetchEmployees)
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
.border-t { border-top: 1px solid #2e3852; }
</style>
