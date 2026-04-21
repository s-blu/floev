import { de } from './de'
import { en } from './en'

export const t = navigator.language.startsWith('de') ? de : en
