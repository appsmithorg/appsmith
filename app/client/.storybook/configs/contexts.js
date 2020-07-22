// import { ThemeProvider, theme } from "../../src/constants/DefaultTheme";
import { buttonCustomTheme } from "../../src/components/ads/baseTheme";
import { ThemeProvider } from "styled-components";

export const contexts = [
    {
        icon: "box",
        title: "Themes",
        components: [ThemeProvider],
        params: [{ name: "default", props: { theme: buttonCustomTheme } }],
    },
];