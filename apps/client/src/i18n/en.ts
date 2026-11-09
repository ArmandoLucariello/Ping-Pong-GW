export const en = {
  home: {
    server: {
      checking: 'Server: checking',
      online: 'Server: online',
      offline: 'Server: offline',
    },
  },
  language: {
    label: 'Language',
    en: 'English',
    it: 'Italian',
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

export type Translation = Widen<typeof en>;
