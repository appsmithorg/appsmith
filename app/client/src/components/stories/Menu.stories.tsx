import React from "react";
import { select, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Menu from "../ads/Menu";
import { decorate } from "@storybook/addon-actions";
import Icon from "../ads/Icon";
import { Size } from "../ads/Button";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import Text, { TextType } from "../ads/Text";

export default {
  title: "Menu",
  component: Menu,
  decorators: [withKnobs, withDesign],
};

const firstArg = decorate([args => args.slice(0, 1)]);

export const TextMenu = () => (
  <Menu
    onSelect={firstArg.action("text-click")}
    position={select(
      "position",
      [
        Position.RIGHT,
        Position.RIGHT_BOTTOM,
        Position.RIGHT_TOP,
        Position.LEFT,
        Position.LEFT_BOTTOM,
        Position.LEFT_TOP,
        Position.TOP_LEFT,
        Position.BOTTOM,
        Position.BOTTOM_LEFT,
        Position.BOTTOM_RIGHT,
        Position.TOP,
        Position.TOP_LEFT,
        Position.TOP_RIGHT,
      ],
      Position.RIGHT,
    )}
    target={<button>Click to show menu</button>}
  >
    <Text type={TextType.P1}>First Option</Text>
    <Text type={TextType.P1}>Second option</Text>
    <Text type={TextType.P1}>Third option</Text>
  </Menu>
);

export const IconAndTextMenu = () => (
  <Menu
    onSelect={firstArg.action("icon-click")}
    position={select(
      "position",
      [
        Position.RIGHT,
        Position.RIGHT_BOTTOM,
        Position.RIGHT_TOP,
        Position.LEFT,
        Position.LEFT_BOTTOM,
        Position.LEFT_TOP,
        Position.TOP_LEFT,
        Position.BOTTOM,
        Position.BOTTOM_LEFT,
        Position.BOTTOM_RIGHT,
        Position.TOP,
        Position.TOP_LEFT,
        Position.TOP_RIGHT,
      ],
      Position.RIGHT,
    )}
    target={<button>Click to show menu</button>}
  >
    <div style={{ display: "flex", alignItems: "center" }}>
      <Icon name={"delete"} size={Size.large} />
      <Text style={{ marginLeft: "10px" }} type={TextType.P1}>
        Delete
      </Text>
    </div>
    <div style={{ display: "flex", alignItems: "center" }}>
      <Icon name={"user"} size={Size.large} />
      <Text style={{ marginLeft: "10px" }} type={TextType.P1}>
        Invite user
      </Text>
    </div>
  </Menu>
);
