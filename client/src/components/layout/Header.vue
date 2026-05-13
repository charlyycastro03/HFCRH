<template>
  <div class="page-header">
    <div class="header-left">
      <div class="page-title">{{ title }}</div>
      <div class="page-breadcrumb">{{ breadcrumb }}</div>
    </div>
    <div class="header-right">
      <span class="user-role-badge">{{ userRole }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const titleMap: Record<string, { title: string; breadcrumb: string }> = {
  Dashboard: { title: 'Bienvenido', breadcrumb: 'Panel principal' },
  UserManagement: { title: 'Usuarios', breadcrumb: 'Administración' },
  EmployeeManagement: { title: 'Empleados', breadcrumb: 'Administración' },
  VacationRequest: { title: 'Vacaciones', breadcrumb: 'Solicitar' },
  Reports: { title: 'Reportes', breadcrumb: 'Consultas' },
}

const info = computed(() => titleMap[route.name?.toString() || ''] || { title: route.name?.toString() || '', breadcrumb: '' })
const title = computed(() => info.value.title)
const breadcrumb = computed(() => info.value.breadcrumb)

const userRole = computed(() => {
  const r = authStore.user?.role
  if (r === 'admin') return 'Administrador'
  if (r === 'hr') return 'Recursos Humanos'
  return 'Colaborador'
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #F1F5F9;
  line-height: 1.2;
}

.page-breadcrumb {
  font-size: 13px;
  color: #64748B;
  margin-top: 4px;
}

.user-role-badge {
  background: rgba(99, 102, 241, 0.12);
  color: #6366F1;
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}
</style>