import React from "react";
import { withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Menu from "../ads/Menu";
import { decorate } from "@storybook/addon-actions";
import { Icon } from "../ads/Icon";
import { Size } from "../ads/Button";

export default {
  title: "Menu",
  component: Menu,
  decorators: [withKnobs, withDesign],
};

const firstArg = decorate([args => args.slice(0, 1)]);

export const TextMenu = () => (
  <Menu onSelect={firstArg.action("text-click")}>
    <span>First option</span>
    <span>Second option</span>
    <span>Third option</span>
  </Menu>
);

export const IconMenu = () => (
  <Menu onSelect={firstArg.action("icon-click")}>
    <div style={{ display: "flex", alignItems: "center" }}>
      <Icon name={"delete"} size={Size.large} />
      <span style={{ marginLeft: "10px" }}>Delete</span>
    </div>
    <div style={{ display: "flex", alignItems: "center" }}>
      <Icon name={"user"} size={Size.large} />
      <span style={{ marginLeft: "10px" }}>Invite user</span>
    </div>
  </Menu>
);
