import { TYPOGRAPHY_VARIANTS } from "../token";

export const getTypographyClassName = (
  key: keyof typeof TYPOGRAPHY_VARIANTS,
) => {
  return `wds-${TYPOGRAPHY_VARIANTS[key]}-text`;
};
