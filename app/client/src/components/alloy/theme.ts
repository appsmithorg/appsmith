import { extendTheme } from "@chakra-ui/react";

import buttonStyles from "./Button/styles";
import iconButtonStyles from "./IconButton/styles";
import iconStyles from "./Icon/styles";

const theme = extendTheme({
  colors: {
    primary: {
      "50": "#FFFFFF",
      "100": "#FFF5F0",
      "200": "#FDD2BF",
      "300": "#FBAF8E",
      "400": "#FA8D5C",
      "500": "#F86A2B",
      "600": "#E84D08",
      "700": "#B73C06",
      "800": "#862C04",
      "900": "#541C03",
    },
  },
  components: {
    Button: buttonStyles,
    Icon: iconStyles,
  },
});

export default theme;
