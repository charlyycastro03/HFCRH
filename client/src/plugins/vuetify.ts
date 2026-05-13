import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { es } from 'vuetify/locale'

export default createVuetify({
  components,
  directives,
  locale: {
    locale: 'es',
    messages: { es },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#111936',
          surface: '#1A223F',
          primary: '#635BFF',
          secondary: '#13DEB9',
          info: '#03c9d7',
          success: '#13DEB9',
          warning: '#FFAE1F',
          error: '#FA896B',
        },
      },
    },
  },
})
