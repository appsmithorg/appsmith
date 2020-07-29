import { configure, addDecorator, addParameters } from "@storybook/react";
import { withContexts } from "@storybook/addon-contexts/react";
import { contexts } from "./configs/contexts";
import { } from '@storybook/react'; // <- or your storybook framework

addDecorator(withContexts(contexts));
addParameters({
    backgrounds: [
        { name: 'dark', value: '#090707', default: true },
        { name: 'light', value: '#fff' },
    ],
});
configure(require.context("../src", true, /\.stories\.tsx$/), module);
