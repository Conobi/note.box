import en from '~/locales/en.json'
import es from '~/locales/es.json'
import fr from '~/locales/fr.json'
import de from '~/locales/de.json'
import pt from '~/locales/pt.json'
import zh from '~/locales/zh.json'
import ja from '~/locales/ja.json'
import ko from '~/locales/ko.json'
import ar from '~/locales/ar.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es, fr, de, pt, zh, ja, ko, ar },
}))
