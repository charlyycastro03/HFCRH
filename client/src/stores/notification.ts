import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    show: false,
    text: '',
    color: 'success',
    timeout: 4000,
  }),
  actions: {
    notify(text: string, color = 'success', timeout = 4000) {
      this.text = text
      this.color = color
      this.timeout = timeout
      this.show = true
    },
    success(text: string) {
      this.notify(text, 'success', 4000)
    },
    error(text: string) {
      this.notify(text, 'error', 6000)
    },
  },
})
