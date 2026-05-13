<template>
  <v-container fluid class="h-screen d-flex align-center justify-center" style="background: #0a0e27;">
    <v-card class="rounded-lg elevation-10" max-width="420" width="100%" style="background: #1A223F; border: 1px solid #2e3852;">
      <v-card-text class="pa-8">
        <div class="text-center mb-6">
          <v-avatar size="64" color="primary" class="mb-3">
            <span class="text-h4 font-weight-bold">HF</span>
          </v-avatar>
          <h1 class="text-h5 font-weight-bold text-white">HFC Construcciones</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">Portal Corporativo</p>
        </div>

        <v-window v-model="step" style="overflow: visible;">
          <v-window-item :value="1">
            <v-label class="text-body-2 font-weight-bold text-white mb-2">Correo Electrónico</v-label>
            <v-text-field
              v-model="email"
              prepend-inner-icon="mdi-email"
              placeholder="tu@correo.com"
              variant="outlined"
              bg-color="#111936"
              :error-messages="authStore.error"
              @keyup.enter="enviarCodigo"
              hide-details="auto"
              class="mb-4"
            />
            <v-btn block color="primary" size="large" :loading="authStore.loading" @click="enviarCodigo">
              Enviar Código
            </v-btn>
          </v-window-item>

          <v-window-item :value="2">
            <div class="bg-#111936 pa-4 rounded-lg mb-4 d-flex align-center">
              <v-icon color="primary" class="mr-3">mdi-information</v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">Código enviado a:</div>
                <div class="text-body-2 font-weight-bold text-white">{{ authStore.tempEmail }}</div>
              </div>
            </div>

            <v-label class="text-body-2 font-weight-bold text-white mb-2">Código de Verificación</v-label>
            <v-text-field
              v-model="code"
              prepend-inner-icon="mdi-lock"
              placeholder="000000"
              variant="outlined"
              bg-color="#111936"
              maxlength="6"
              :error-messages="authStore.error"
              @keyup.enter="verificarCodigo"
              hide-details="auto"
              class="mb-4"
            />

            <v-btn block color="primary" size="large" :loading="authStore.loading" @click="verificarCodigo">
              Iniciar Sesión
            </v-btn>

            <v-btn variant="text" color="grey" size="small" block class="mt-2" @click="authStore.step = 1">
              <v-icon start>mdi-arrow-left</v-icon> Cambiar correo
            </v-btn>
          </v-window-item>
        </v-window>

        <div class="mt-6 text-center text-caption text-medium-emphasis">
          &copy; {{ new Date().getFullYear() }} HFC Construcciones
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const code = ref('')
const step = computed(() => authStore.step)

const enviarCodigo = async () => {
  if (!email.value) return
  await authStore.requestLoginCode(email.value)
}

const verificarCodigo = async () => {
  if (!code.value) return
  const success = await authStore.verifyLoginCode(code.value)
  if (success) router.push('/dashboard')
}
</script>
