export type brandColorsKeys =
  | "primary"
  | "background"
  | "font"
  | "hover"
  | "disabled";

export interface Inputs {
  brandColors: Record<brandColorsKeys, string>;
  brandLogo: string;
  brandFavicon: string;
}
