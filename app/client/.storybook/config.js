import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "../src/index.css";

import { configure, addDecorator } from "@storybook/react";
import { withContexts } from "@storybook/addon-contexts/react";
import { contexts } from "./configs/contexts";

addDecorator(withContexts(contexts));
configure(require.context("../src", true, /\.stories\.tsx$/), module);
