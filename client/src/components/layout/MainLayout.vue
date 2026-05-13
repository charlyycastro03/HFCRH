<template>
  <v-app>
    <Sidebar />
    <Header />
    <v-main class="bg-background">
      <v-container fluid class="pa-6 h-100">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

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
