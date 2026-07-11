export type LocaleText = {
  zh: string;
  en?: string;
};

export function getLocalizedText(
  value: LocaleText | undefined,
  locale: keyof LocaleText,
) {
  if (!value) {
    return null;
  }

  return value[locale] ?? value.zh;
}

export function hasLocalizedText(value: LocaleText | undefined) {
  return Boolean(value?.zh?.trim());
}
