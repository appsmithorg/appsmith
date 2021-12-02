const theme = {
  config: {
    colors: {
      primary: "#0f0",
      secondary: "#f00",
    },
    borderRadius: {
      appBorderRadius: "6px",
    },
    shadow: {
      appShadow: "0px 0px 3px",
    },
    shadowColor: {
      appShadowColor: "#f4f4f4",
    },
    fontFamily: {
      appFont: ["'roboto san-seriff'", "http://googlrfont"],
    },
  },
  stylesheet: {
    BUTTON_WIDGET: {
      buttonColor: "{{appsmith.theme.colors.primary}}",
    },
  },
  properties: {
    colors: {
      primary: "#0f0",
      secondary: "#f00",
    },
    borderRadius: {
      appBorderRadius: "6px",
    },
    shadow: {
      appShadow: "0px 0px 3px",
    },
    shadowColor: {
      appShadowColor: "#f4f4f4",
    },
    fontFamily: {
      appFont: ["'roboto san-seriff'", "http://googlrfont"],
    },
  },
};

export const getSelectedAppTheme = () => {
  return theme;
};

export const getSelectedAppThemeStylesheet = () => {
  return theme.stylesheet;
};

export const getSelectedAppThemeProperty = () => {
  return theme.properties;
};
