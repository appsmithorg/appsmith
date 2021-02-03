import { ThemeProvider, theme } from "../../src/constants/DefaultTheme";
import { light, dark } from "constants/DefaultTheme";

export const contexts = [
  {
    icon: "box",
    title: "Themes",
    components: [ThemeProvider],
    params: [
      {
        name: "lightTheme",
        props: {
          theme: {
            ...theme,
            colors: {
              ...theme.colors,
              ...light,
            },
          },
        },
      },
      {
        name: "darkTheme",
        props: {
          theme: {
            ...theme,
            colors: {
              ...theme.colors,
              ...dark,
            },
          },
        },
      },
    ],
  },
];
