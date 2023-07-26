import { theming } from "./decorators/theming";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "./styles.css";

export const decorators = [theming];

const customViewports = {
  kindleFire2: {
    name: "Kindle Fire 2",
    styles: {
      width: "600px",
      height: "963px",
    },
  },
  kindleFireHD: {
    name: "Kindle Fire HD",
    styles: {
      width: "533px",
      height: "801px",
    },
  },
};

const preview = {
  globalTypes: {
    colorMode: {},
    borderRadius: {},
    accentColor: {},
    fontFamily: {},
    rootUnitRatio: {},
  },
  parameters: {
    viewport: { viewports: customViewports },
    actions: { argTypesRegex: "^on[A-Z].*" },
  },
};

export default preview;
