import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// S1-MOB-02: i18n ES/EN. ES default (decisión de proyecto).
const i18n = new I18n({
  es: {
    auth: {
      title: 'Iniciar sesión',
      subtitle: 'Perforación Zacatecas',
      email: 'Correo electrónico',
      password: 'Contraseña',
      submit: 'Entrar',
      submitting: 'Entrando…',
      errorInvalid: 'Correo o contraseña incorrectos',
      errorGeneric: 'No se pudo iniciar sesión. Intenta de nuevo.',
      signOut: 'Cerrar sesión',
    },
    home: {
      title: 'Mis turnos',
      welcome: 'Sesión iniciada como',
      hint: 'La captura de DSR llega en el Sprint S4.',
      offlineReady: 'Base local lista (SQLite)',
    },
  },
  en: {
    auth: {
      title: 'Sign in',
      subtitle: 'Perforación Zacatecas',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      errorInvalid: 'Invalid email or password',
      errorGeneric: 'Could not sign in. Please try again.',
      signOut: 'Sign out',
    },
    home: {
      title: 'My shifts',
      welcome: 'Signed in as',
      hint: 'DSR capture ships in Sprint S4.',
      offlineReady: 'Local database ready (SQLite)',
    },
  },
});

i18n.defaultLocale = 'es';
i18n.locale = getLocales()[0]?.languageCode ?? 'es';
i18n.enableFallback = true;

export const t = i18n.t.bind(i18n);
export default i18n;
