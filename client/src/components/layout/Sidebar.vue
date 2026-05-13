<template>
  <v-navigation-drawer v-model="drawer" app expand-on-hover rail-width="72" width="260" class="leftSidebar">
    <template v-slot:prepend>
      <div class="pa-4 d-flex align-center">
        <v-avatar size="40" color="primary" class="mr-3">
          <span class="text-h6 font-weight-bold text-white">HF</span>
        </v-avatar>
        <div v-show="!rail">
          <div class="text-subtitle-1 font-weight-bold">HFC</div>
          <div class="text-caption text-medium-emphasis">Portal Corporativo</div>
        </div>
      </div>
      <v-divider />
    </template>

    <v-list density="compact" nav class="py-2 px-2">
      <v-list-item
        v-for="item in menuItems"
        :key="item.title"
        :prepend-icon="item.icon"
        :title="item.title"
        :to="item.path"
        color="primary"
        rounded="lg"
        class="mb-1"
        v-show="!item.adminOnly || isAdmin"
      />
    </v-list>

    <template v-slot:append>
      <v-divider />
      <div class="pa-4 d-flex align-center">
        <v-avatar size="36" color="surface-variant" class="mr-3">
          <span class="text-body-2 font-weight-bold">{{ initials }}</span>
        </v-avatar>
        <div v-show="!rail" class="flex-grow-1">
          <div class="text-body-2 font-weight-bold text-truncate">{{ userName }}</div>
          <div class="text-caption text-medium-emphasis">{{ userRole }}</div>
        </div>
        <v-btn icon="mdi-logout" variant="text" size="small" @click="logout" />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const drawer = computed({
  get: () => true,
  set: () => {},
})

const rail = computed(() => false)
const isAdmin = computed(() => authStore.user?.role === 'admin')
const userName = computed(() => authStore.user?.name || 'Usuario')
const userRole = computed(() => {
  const r = authStore.user?.role
  if (r === 'admin') return 'Administrador'
  if (r === 'hr') return 'RH'
  return 'Colaborador'
})
const initials = computed(() => {
  const name = authStore.user?.name || 'U'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
})

const menuItems = [
  { title: 'Inicio', icon: 'mdi-view-dashboard', path: '/dashboard' },
  { title: 'Solicitar Vacaciones', icon: 'mdi-calendar-check', path: '/vacaciones/solicitar' },

  { title: 'Reportes', icon: 'mdi-file-chart', path: '/rh/reportes', adminOnly: true },
  { title: 'Usuarios', icon: 'mdi-account-group', path: '/admin/users', adminOnly: true },
  { title: 'Empleados', icon: 'mdi-account-tie', path: '/admin/employees', adminOnly: true },
]

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.leftSidebar {
  background: #1A223F !important;
  border-right: 1px solid #2e3852;
}
</style>
