import { ThemeProvider, theme } from "../../src/constants/DefaultTheme";

export const contexts = [
    {
        icon: "box",
        title: "Themes",
        components: [ThemeProvider],
        params: [{ name: "default", props: { theme: theme } }],
    },
];