export type WritingFont =
  | 'inter'
  | 'google-sans-flex'
  | 'vollkorn'
  | 'source-serif-4'
  | 'cascadia-code'
  | 'inconsolata'
  | 'lexend'

export type ColorScheme = 'light' | 'dark'

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar'

export type CopyFormat = 'html' | 'markdown'

export interface AppSettings {
  font: WritingFont
  colorScheme: ColorScheme
  locale?: SupportedLocale
  copyFormat?: CopyFormat
}
