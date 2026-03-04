export type WritingFont =
  | 'inter'
  | 'google-sans-flex'
  | 'vollkorn'
  | 'source-serif-4'
  | 'cascadia-code'
  | 'inconsolata'
  | 'lexend'

export type ColorScheme = 'light' | 'dark'

export interface AppSettings {
  font: WritingFont
  colorScheme: ColorScheme
}
