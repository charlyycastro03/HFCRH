<template>
  <v-app class="main-app">
    <Sidebar />
    <v-main class="main-content">
      <div class="page-container">
        <Transition name="page" mode="out-in">
          <router-view />
        </Transition>
      </div>
    </v-main>
    <BottomNav />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Sidebar from './Sidebar.vue'
import BottomNav from './BottomNav.vue'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  } else if (!authStore.user) {
    await authStore.restoreSession()
  }
})
</script>

<style>
* {
  scroll-behavior: smooth;
}

html, body {
  overflow-x: hidden;
}
</style>

<style scoped>
.main-app {
  background: #0F172A;
  min-height: 100vh;
}

.main-content {
  background: #0F172A;
  min-height: 100vh;
  padding-left: 240px;
}

.page-container {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 960px) {
  .main-content {
    padding-left: 0;
    padding-bottom: 72px;
  }
  .page-container {
    padding: 20px 16px;
  }
}
</style>