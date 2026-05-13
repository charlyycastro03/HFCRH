<template>
  <div>
    <h2 class="text-h5 font-weight-bold text-white mb-4">Gestión de Usuarios</h2>
    <v-card class="rounded-lg card-dark">
      <v-card-title class="pa-4 d-flex justify-space-between align-center border-b">
        <span>Usuarios del Sistema</span>
        <v-btn color="primary" @click="openDialog()"><v-icon start>mdi-plus</v-icon> Nuevo</v-btn>
      </v-card-title>
      <v-data-table :headers="headers" :items="users" :loading="loading" class="bg-transparent">
        <template v-slot:item.role="{ item }">
          <v-chip :color="getRoleColor(item.role)" size="small">{{ item.role }}</v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" class="mr-1" @click="openDialog(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-lg card-dark">
        <v-card-title class="border-b pa-4">{{ formTitle }}</v-card-title>
        <v-card-text class="pa-4">
          <v-text-field v-model="editedItem.name" label="Nombre" variant="outlined" bg-color="#111936" class="mb-3" />
          <v-text-field v-model="editedItem.email" label="Email" variant="outlined" bg-color="#111936" class="mb-3" />
          <v-select v-model="editedItem.role" :items="['admin', 'hr', 'User']" label="Rol" variant="outlined" bg-color="#111936" />
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer />
          <v-btn variant="text" @click="close">Cancelar</v-btn>
          <v-btn color="primary" @click="save">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

const users = ref<any[]>([])
const loading = ref(true)
const dialog = ref(false)
const editedIndex = ref(-1)
const editedItem = ref<any>({ name: '', email: '', role: 'User' })

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Rol', key: 'role' },
  { title: 'Acciones', key: 'actions', sortable: false },
]

const formTitle = computed(() => editedIndex.value === -1 ? 'Nuevo Usuario' : 'Editar Usuario')

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/admin/users')
    users.value = data
  } finally {
    loading.value = false
  }
}

const getRoleColor = (role: string) => {
  if (role === 'admin') return 'purple'
  if (role === 'hr') return 'info'
  return 'blue'
}

const openDialog = (item?: any) => {
  if (item) {
    editedIndex.value = users.value.indexOf(item)
    editedItem.value = { ...item }
  } else {
    editedIndex.value = -1
    editedItem.value = { name: '', email: '', role: 'User' }
  }
  dialog.value = true
}

const close = () => {
  dialog.value = false
  editedIndex.value = -1
  editedItem.value = { name: '', email: '', role: 'User' }
}

const save = async () => {
  try {
    if (editedIndex.value > -1) {
      await api.put(`/admin/users/${editedItem.value.id}`, editedItem.value)
    } else {
      await api.post('/admin/users', editedItem.value)
    }
    await fetchUsers()
    close()
  } catch (err: any) {
    alert(err.response?.data?.msg || 'Error al guardar')
  }
}

const deleteItem = async (item: any) => {
  if (!confirm('¿Eliminar usuario?')) return
  try {
    await api.delete(`/admin/users/${item.id}`)
    await fetchUsers()
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.card-dark { background: #1A223F !important; border: 1px solid #2e3852; }
.border-b { border-bottom: 1px solid #2e3852; }
.border-t { border-top: 1px solid #2e3852; }
</style>
