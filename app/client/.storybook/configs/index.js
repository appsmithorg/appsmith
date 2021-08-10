import { ThemeProvider, theme } from "../../src/constants/DefaultTheme";
import { light } from "constants/DefaultTheme";

const DefaultTheme = { ...theme, colors: { ...theme.colors, ...light } };

export { DefaultTheme, ThemeProvider }