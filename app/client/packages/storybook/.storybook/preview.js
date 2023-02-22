import { resizor } from "./decorators/resizor";
import { theming } from "./decorators/theming";
import { borderRadius } from "./globals/borderRadius";
import { accentColor } from "./globals/accentColor";

import "./styles.css";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
    expanded: true,
  },
};

export const decorators = [resizor, theming];

export const globalTypes = {
  borderRadius,
  accentColor,
};
