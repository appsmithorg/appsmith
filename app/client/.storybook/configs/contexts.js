// import { ThemeProvider, theme } from "../../src/constants/DefaultTheme";
import { adsTheme } from "../../src/components/ads/baseTheme";
import { ThemeProvider } from "styled-components";

export const contexts = [
    {
        icon: "box",
        title: "Themes",
        components: [ThemeProvider],
        params: [{ name: "default", props: { theme: adsTheme } }],
    },
];