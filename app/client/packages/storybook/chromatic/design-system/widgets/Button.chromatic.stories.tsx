import React from "react";
import {
  Button,
  BUTTON_VARIANTS,
  BUTTON_COLORS,
  Icon,
} from "@design-system/widgets";
import { importRemixIcon } from "design-system-old";
import type { Meta, StoryObj } from "@storybook/react";

import { StoryGrid } from "../../../helpers/StoryGrid";
import { DataAttrWrapper } from "../../../helpers/DataAttrWrapper";

const StarIcon = importRemixIcon(() => import("remixicon-react/StarFillIcon"));

const variants = Object.values(BUTTON_VARIANTS);
const colors = Object.values(BUTTON_COLORS);

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Design System/Widgets/Button",
};

export default meta;

type Story = StoryObj<typeof Button>;

const states = [
  "",
  "data-hovered",
  "data-active",
  "data-focused",
  "aria-disabled",
];

const ICON = (
  <Icon>
    <StarIcon />
  </Icon>
);

export const LightMode: Story = {
  render: () => (
    <StoryGrid>
      {variants.map((variant) =>
        colors.map((color) =>
          states.map((state) => (
            <DataAttrWrapper attr={state} key={`${variant}-${color}-${state}`}>
              <Button
                color={color}
                variant={variant}
              >{`${variant} ${color} ${state}`}</Button>
            </DataAttrWrapper>
          )),
        ),
      )}
      <Button icon={ICON}>Button with Start Icon</Button>
      <Button icon={ICON} iconPosition="end">
        Button with End Icon
      </Button>
      <Button isLoading>Loading...</Button>
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};
