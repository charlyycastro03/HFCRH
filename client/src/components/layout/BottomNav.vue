<template>
  <v-bottom-navigation grow class="bottom-nav" bg-color="#0F172A">
    <v-btn
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="bottom-nav-item"
      :value="item.path"
    >
      <v-icon>{{ item.icon }}</v-icon>
      <span class="nav-label">{{ item.title }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const navItems = computed(() => {
  const items = [
    { title: 'Inicio', icon: 'mdi-view-dashboard', path: '/dashboard' },
    { title: 'Vacaciones', icon: 'mdi-calendar-check', path: '/vacaciones/solicitar' },
    { title: 'Reportes', icon: 'mdi-file-chart', path: '/rh/reportes' },
  ]
  if (isAdmin.value) {
    items.push({ title: 'Admin', icon: 'mdi-cog', path: '/admin/users' })
  }
  return items
})
</script>

<style scoped>
.bottom-nav {
  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
  display: none !important;
  height: 64px !important;
}

.bottom-nav-item {
  color: #64748B !important;
  font-size: 11px;
  min-width: 64px;
  transition: all 0.2s;
}

.bottom-nav-item :deep(.v-btn__content) {
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.bottom-nav-item .v-icon {
  font-size: 22px !important;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.bottom-nav-item--active {
  color: #6366F1 !important;
}

.bottom-nav-item--active .v-icon {
  color: #6366F1 !important;
}

@media (max-width: 960px) {
  .bottom-nav {
    display: flex !important;
  }
}
</style>