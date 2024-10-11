import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StoryGrid, DataAttrWrapper } from "@design-system/storybook";
import { Button, BUTTON_VARIANTS, COLORS } from "@appsmith/wds";
import { objectKeys } from "@appsmith/utils";

const variants = objectKeys(BUTTON_VARIANTS);
const colors = Object.values(COLORS);

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Design System/Widgets/Button",
};

export default meta;

type Story = StoryObj<typeof Button>;

const states = [
  "",
  "data-hovered",
  "data-pressed",
  "data-focus-visible",
  "aria-disabled",
];

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
      <Button icon="star">Button with Start Icon</Button>
      <Button icon="star" iconPosition="end">
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
