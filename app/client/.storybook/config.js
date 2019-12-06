import { configure, addDecorator } from "@storybook/react";
import { withContexts } from "@storybook/addon-contexts/react";
import { contexts } from "./configs/contexts";

addDecorator(withContexts(contexts));
configure(require.context("../src", true, /\.stories\.tsx$/), module);
