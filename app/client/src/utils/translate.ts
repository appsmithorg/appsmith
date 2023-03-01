import { LanguageEnums } from "entities/App";

export const translate = (
  lang?: LanguageEnums,
  primitiveText?: string,
  translationJp?: string,
) => {
  if (!translationJp) return primitiveText || "";
  return lang === LanguageEnums.JA ? translationJp : primitiveText || "";
};
