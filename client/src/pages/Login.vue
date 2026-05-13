<template>
  <v-app class="login-app">
    <div class="login-bg" :style="{ backgroundImage: `url(/portada.jpg)` }">
      <div class="login-overlay" />
    </div>

    <div class="login-container">
      <Transition name="slide-up" appear>
        <v-card class="login-card" elevation="0">
          <v-card-text class="pa-8">
            <div class="login-brand">
              <div class="brand-text">HFC</div>
              <div class="brand-sub">Construcciones</div>
            </div>
            <p class="login-tagline text-center mb-6">Portal de Gestión de Vacaciones</p>

            <v-window v-model="step" class="login-window">
              <v-window-item :value="1">
                <div class="input-group">
                  <v-text-field
                    v-model="email"
                    label="Correo electrónico"
                    prepend-inner-icon="mdi-email-outline"
                    placeholder="tu@correo.com"
                    :error-messages="authStore.error"
                    @keyup.enter="enviarCodigo"
                    color="primary"
                    bg-color="rgba(255,255,255,0.05)"
                    hide-details="auto"
                    class="mb-2"
                    rounded="lg"
                  />
                </div>
                <v-btn
                  block
                  color="primary"
                  size="x-large"
                  :loading="authStore.loading"
                  rounded="xl"
                  class="login-btn"
                  @click="enviarCodigo"
                >
                  <v-icon start>mdi-send-clock</v-icon>
                  Enviar código
                </v-btn>
              </v-window-item>

              <v-window-item :value="2">
                <div class="email-hint mb-4">
                  <v-icon size="18" color="primary" class="mr-2">mdi-email-check</v-icon>
                  <span class="text-caption">Código enviado a</span>
                  <span class="text-body-2 font-weight-bold ml-1">{{ authStore.tempEmail }}</span>
                </div>
                <v-text-field
                  v-model="code"
                  label="Código de verificación"
                  prepend-inner-icon="mdi-lock-outline"
                  placeholder="000000"
                  :error-messages="authStore.error"
                  @keyup.enter="verificarCodigo"
                  color="primary"
                  bg-color="rgba(255,255,255,0.05)"
                  maxlength="6"
                  hide-details="auto"
                  class="mb-4"
                  rounded="lg"
                />
                <v-btn
                  block
                  color="primary"
                  size="x-large"
                  :loading="authStore.loading"
                  rounded="xl"
                  class="login-btn"
                  @click="verificarCodigo"
                >
                  <v-icon start>mdi-login</v-icon>
                  Iniciar sesión
                </v-btn>
                <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  block
                  class="mt-3"
                  @click="authStore.step = 1"
                >
                  <v-icon start size="16">mdi-arrow-left</v-icon>
                  Usar otro correo
                </v-btn>
              </v-window-item>
            </v-window>

            <div class="login-footer">
              <span>© {{ year }} HFC Construcciones · Ley Mexicana del Trabajo</span>
            </div>
          </v-card-text>
        </v-card>
      </Transition>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const code = ref('')
const step = computed(() => authStore.step)
const year = new Date().getFullYear()

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

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({ name: 'Login' })
</script>

<style scoped>
.login-app {
  min-height: 100vh;
  overflow: hidden;
}

.login-bg {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.login-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.85) 0%,
    rgba(30, 41, 59, 0.7) 50%,
    rgba(15, 23, 42, 0.9) 100%
  );
  backdrop-filter: blur(2px);
}

.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(30, 41, 59, 0.92) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 24px !important;
}

.login-brand {
  text-align: center;
  margin-bottom: 4px;
}

.brand-text {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 8px;
  background: linear-gradient(135deg, #6366F1, #818CF8, #F97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.brand-sub {
  font-size: 14px;
  font-weight: 300;
  color: #94A3B8;
  letter-spacing: 6px;
  text-transform: uppercase;
}

.login-tagline {
  font-size: 13px;
  color: #64748B;
  letter-spacing: 0.5px;
}

.login-window {
  overflow: visible;
}

.email-hint {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.login-btn {
  height: 52px !important;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 11px;
  color: #475569;
  letter-spacing: 0.3px;
}

.slide-up-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(32px);
}

:deep(.v-field) {
  border-radius: 12px !important;
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.15;
}

:deep(.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #6366F1;
}

:deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
</style>