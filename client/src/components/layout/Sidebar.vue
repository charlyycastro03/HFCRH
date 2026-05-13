<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    width="240"
    class="main-sidebar"
  >
    <template v-slot:prepend>
      <div class="sidebar-brand" @click="rail = !rail">
        <div class="brand-logo">HFC</div>
        <Transition name="fade">
          <div v-if="!rail" class="brand-info">
            <div class="brand-name">HFC</div>
            <div class="brand-tag">Construcciones</div>
          </div>
        </Transition>
        <v-icon class="rail-toggle" size="16">mdi-chevron-left</v-icon>
      </div>
      <div class="sidebar-divider" />
    </template>

    <v-list density="comfortable" nav class="sidebar-nav">
      <v-list-item
        v-for="item in visibleMenuItems"
        :key="item.path"
        :to="item.path"
        :prepend-icon="item.icon"
        :title="item.title"
        class="sidebar-item"
        rounded="xl"
        active-class="sidebar-item--active"
      />
    </v-list>

    <template v-slot:append>
      <div class="sidebar-divider" />
      <div class="sidebar-user" :class="{ 'sidebar-user--rail': rail }">
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
        <v-btn
          icon="mdi-logout"
          variant="text"
          size="small"
          class="logout-btn"
          @click="logout"
        />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const drawer = ref(true)
const rail = ref(false)

const isAdmin = computed(() => authStore.user?.role === 'admin')
const userName = computed(() => authStore.user?.name || 'Usuario')
const userRole = computed(() => {
  const r = authStore.user?.role
  if (r === 'admin') return 'Administrador'
  if (r === 'hr') return 'Recursos Humanos'
  return 'Colaborador'
})

const menuItems = [
  { title: 'Inicio', icon: 'mdi-view-dashboard', path: '/dashboard' },
  { title: 'Solicitar Vacaciones', icon: 'mdi-calendar-check', path: '/vacaciones/solicitar' },
  { title: 'Reportes', icon: 'mdi-file-chart', path: '/rh/reportes', adminOnly: true },
  { title: 'Usuarios', icon: 'mdi-account-group', path: '/admin/users', adminOnly: true },
  { title: 'Empleados', icon: 'mdi-account-tie', path: '/admin/employees', adminOnly: true },
]

const visibleMenuItems = computed(() =>
  menuItems.filter(item => !item.adminOnly || isAdmin.value)
)

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.main-sidebar {
  background: #0F172A !important;
  border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  cursor: pointer;
  gap: 12px;
  transition: background 0.2s;
}

.sidebar-brand:hover {
  background: rgba(99, 102, 241, 0.08);
}

.brand-logo {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: linear-gradient(135deg, #6366F1, #818CF8);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: white;
  letter-spacing: 1px;
}

.brand-info {
  flex: 1;
  min-width: 0;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: #F1F5F9;
  line-height: 1.2;
}

.brand-tag {
  font-size: 10px;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 500;
}

.rail-toggle {
  color: #475569;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.v-navigation-drawer--rail .rail-toggle {
  transform: rotate(180deg);
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0 16px;
}

.sidebar-nav {
  padding: 12px 10px;
}

.sidebar-item {
  color: #94A3B8 !important;
  margin-bottom: 2px;
  font-weight: 500;
  transition: all 0.2s;
}

.sidebar-item:hover {
  color: #F1F5F9 !important;
  background: rgba(99, 102, 241, 0.08) !important;
}

.sidebar-item :deep(.v-list-item__prepend .v-icon) {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.sidebar-item:hover :deep(.v-list-item__prepend .v-icon) {
  opacity: 1;
}

.sidebar-item--active {
  color: #6366F1 !important;
  background: rgba(99, 102, 241, 0.12) !important;
  border-left: 3px solid #6366F1;
  font-weight: 600;
}

.sidebar-item--active :deep(.v-list-item__prepend .v-icon) {
  color: #6366F1 !important;
  opacity: 1;
}

.sidebar-user {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 10px;
}

.sidebar-user--rail {
  justify-content: center;
  padding: 16px 8px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #F1F5F9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: #64748B;
}

.logout-btn {
  color: #475569 !important;
  flex-shrink: 0;
}

.logout-btn:hover {
  color: #EF4444 !important;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .main-sidebar {
    display: none !important;
  }
}
</style>