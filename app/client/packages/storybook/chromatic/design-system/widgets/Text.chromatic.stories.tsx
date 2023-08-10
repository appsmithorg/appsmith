import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "@design-system/widgets";
import { StoryGrid } from "../../../helpers/StoryGrid";
import { TypographyColor, TypographyVariant } from "@design-system/theming";

const meta: Meta<typeof Text> = {
  component: Text,
  title: "Design System/Widgets/Text",
};

export default meta;

type Story = StoryObj<typeof Text>;

export const LightMode: Story = {
  storyName: "Text",
  render: () => (
    <StoryGrid cols="4">
      <Text>
        Default - Lorem ipsum dolor sit, amet consectetur adipisicing elit.
        Reiciendis, obcaecati velit voluptatibus ratione officia consectetur
        similique ab rem adipisci atque eum dolores culpa cum reprehenderit
        quidem cupiditate impedit modi in.
      </Text>
      <Text lineClamp={2}>
        LineClamp - 2 - Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Enim eaque consequatur vel cupiditate nihil! Natus itaque voluptatibus,
        possimus nisi expedita, inventore nobis obcaecati aspernatur
        necessitatibus, molestias deleniti corrupti aliquam repudiandae.
      </Text>
      <Text lineClamp={1}>
        LineClamp - 1 - Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Enim eaque consequatur vel cupiditate nihil! Natus itaque voluptatibus,
        possimus nisi expedita, inventore nobis obcaecati aspernatur
        necessitatibus, molestias deleniti corrupti aliquam repudiandae.
      </Text>
      <Text textAlign="center">Text Align Center</Text>
      <Text textAlign="right">Text Align Right</Text>
      <Text isItalic>Italic</Text>
      <Text isBold>Bold</Text>
      {Object.values(TypographyVariant).map((variant) => (
        <Text key={variant} variant={variant}>
          {variant}
        </Text>
      ))}
      {Object.values(TypographyColor).map((color) => (
        <Text color={color} key={color}>
          {color}
        </Text>
      ))}
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};
