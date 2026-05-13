<template>
  <div>
    <Header />

    <div class="section-title">
      <v-icon size="20" class="mr-2">mdi-account-group</v-icon>
      Gestión de Usuarios
      <v-spacer />
      <v-btn color="primary" rounded="xl" @click="openDialog()">
        <v-icon start size="18">mdi-plus</v-icon>
        Nuevo Usuario
      </v-btn>
    </div>

    <v-card class="main-card">
      <v-card-text class="pa-0">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td class="id-cell">#{{ user.id }}</td>
                <td class="name-cell">{{ user.name }}</td>
                <td class="email-cell">{{ user.email }}</td>
                <td>
                  <span class="role-badge" :class="user.role">
                    {{ roleLabel(user.role) }}
                  </span>
                </td>
                <td class="actions-cell">
                  <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(user)" />
                  <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem(user)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="480">
      <v-card rounded="xl" class="form-card">
        <v-card-text class="pa-6">
          <div class="form-title">{{ formTitle }}</div>
          <v-text-field v-model="editedItem.name" label="Nombre" class="mt-4" prepend-inner-icon="mdi-account" />
          <v-text-field v-model="editedItem.email" label="Correo electrónico" prepend-inner-icon="mdi-email" />
          <v-select v-model="editedItem.role" :items="roles" label="Rol" prepend-inner-icon="mdi-shield-account" />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn variant="text" rounded="xl" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="xl" :loading="saving" @click="save">Guardar</v-btn>
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
const users = ref<any[]>([])
const loading = ref(true)
const dialog = ref(false)
const saving = ref(false)
const editedIndex = ref(-1)
const editedItem = ref<any>({ id: 0, name: '', email: '', role: 'User' })
const roles = [
  { title: 'Administrador', value: 'admin' },
  { title: 'Recursos Humanos', value: 'hr' },
  { title: 'Colaborador', value: 'User' },
]

const formTitle = computed(() => editedIndex.value === -1 ? 'Nuevo Usuario' : 'Editar Usuario')

const roleLabel = (r: string) => ({ admin: 'Administrador', hr: 'Recursos Humanos', User: 'Colaborador' }[r] || r)

const fetchUsers = async () => {
  loading.value = true
  try { const { data } = await api.get('/admin/users'); users.value = data }
  finally { loading.value = false }
}

const openDialog = (item?: any) => {
  if (item) {
    editedIndex.value = users.value.indexOf(item)
    editedItem.value = { ...item }
  } else {
    editedIndex.value = -1
    editedItem.value = { id: 0, name: '', email: '', role: 'User' }
  }
  dialog.value = true
}

const save = async () => {
  saving.value = true
  try {
    if (editedIndex.value > -1) {
      await api.put(`/admin/users/${editedItem.value.id}`, editedItem.value)
    } else {
      await api.post('/admin/users', editedItem.value)
    }
    dialog.value = false
    await fetchUsers()
    notification.success('Usuario guardado correctamente')
  } catch (e: any) {
    notification.error(e.response?.data?.msg || 'Error al guardar')
  } finally { saving.value = false }
}

const deleteItem = async (item: any) => {
  if (!confirm(`¿Eliminar usuario "${item.name}"?`)) return
  try {
    await api.delete(`/admin/users/${item.id}`)
    await fetchUsers()
    notification.success('Usuario eliminado')
  } catch (e: any) {
    notification.error(e.response?.data?.msg || 'Error al eliminar')
  }
}

onMounted(fetchUsers)
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

.main-card, .form-card {
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

.id-cell { font-weight: 700; color: #6366F1 !important; }
.name-cell { font-weight: 600; color: #F1F5F9 !important; }
.email-cell { color: #64748B !important; }
.actions-cell { white-space: nowrap; }

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.role-badge.admin { background: rgba(99,102,241,0.12); color: #818CF8; }
.role-badge.hr { background: rgba(249,115,22,0.12); color: #FB923C; }
.role-badge.User { background: rgba(56,189,248,0.12); color: #38BDF8; }

.form-title {
  font-size: 18px;
  font-weight: 700;
  color: #F1F5F9;
  padding: 24px 24px 0;
}

@media (max-width: 600px) {
  .data-table { font-size: 12px; }
  .data-table thead th, .data-table tbody td { padding: 10px 12px; }
}
</style>