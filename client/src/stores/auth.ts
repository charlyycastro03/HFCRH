import { defineStore } from 'pinia'
import api from '@/api/axios'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  step: number
  loading: boolean
  error: string | null
  tempEmail: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token'),
    step: 1,
    loading: false,
    error: null,
    tempEmail: '',
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async requestLoginCode(email: string) {
      this.loading = true
      this.error = null
      try {
        await api.post('/auth/login-request', { email })
        this.tempEmail = email
        this.step = 2
      } catch (err: any) {
        this.error = err.response?.data?.msg || 'Error de conexión'
      } finally {
        this.loading = false
      }
    },

    async verifyLoginCode(code: string): Promise<boolean> {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/login-verify', {
          email: this.tempEmail,
          code,
        })
        this.token = data.token
        this.user = data.user
        localStorage.setItem('token', this.token!)
        return true
      } catch (err: any) {
        this.error = err.response?.data?.msg || 'Código incorrecto'
        return false
      } finally {
        this.loading = false
      }
    },

    async restoreSession() {
      const token = this.token || localStorage.getItem('token')
      if (!token) return
      this.token = token
      try {
        const { data } = await api.get('/auth/profile')
        this.user = data.user
      } catch {
        this.logout()
      }
    },

    logout() {
      this.token = null
      this.user = null
      this.step = 1
      this.tempEmail = ''
      localStorage.removeItem('token')
    },
  },
})
