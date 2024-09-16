import { theming } from "./decorators/theming";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "./styles.css";
import { DocsContainer } from "@storybook/addon-docs";
import { StoryThemeProvider } from "../src";

export const decorators = [theming];

const customViewports = {
  HighResLaptop: {
    name: "High-res laptop or desktop",
    styles: {
      width: "1920px",
      height: "1080px",
    },
  },
  Laptop: {
    name: "Laptop",
    styles: {
      width: "1366px",
      height: "768px",
    },
  },
  Tablet: {
    name: "Tablet",
    styles: {
      width: "768px",
      height: "1024px",
    },
  },
  Pixel2: {
    name: "Pixel2",
    styles: {
      width: "411px",
      height: "731px",
    },
  },
  iPhoneX: {
    name: "iPhoneX",
    styles: {
      width: "375px",
      height: "812px",
    },
  },
  Mobile: {
    name: "Mobile",
    styles: {
      width: "360px",
      height: "720px",
    },
  },
};

const preview = {
  globalTypes: {
    colorMode: {},
    borderRadius: {},
    seedColor: {},
    fontFamily: {},
    userDensity: {},
    userSizing: {},
  },

  parameters: {
    viewport: { viewports: customViewports },
    docs: {
      container: ({ children, context }) => (
        <DocsContainer context={context}>
          <StoryThemeProvider theme={context.store.globals.globals}>
            {children}
          </StoryThemeProvider>
        </DocsContainer>
      ),
    },
  },

  tags: ["autodocs"]
};

export default preview;
