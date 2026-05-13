import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { es } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  components,
  directives,
  locale: {
    locale: 'es',
    messages: { es },
  },
  theme: {
    defaultTheme: 'hfcDark',
    themes: {
      hfcDark: {
        dark: true,
        colors: {
          background: '#0F172A',
          surface: '#1E293B',
          surfaceVariant: '#334155',
          primary: '#6366F1',
          secondary: '#F97316',
          info: '#38BDF8',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          'on-background': '#F1F5F9',
          'on-surface': '#F1F5F9',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'xl',
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VChip: {
      rounded: 'lg',
    },
  },
})