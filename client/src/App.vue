<template>
  <v-app>
    <router-view />
    <v-snackbar
      v-model="notification.show"
      :color="notification.color"
      :timeout="notification.timeout"
      location="top right"
      elevation="24"
    >
      {{ notification.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="notification.show = false" icon="mdi-close" />
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification'
const notification = useNotificationStore()
</script>
