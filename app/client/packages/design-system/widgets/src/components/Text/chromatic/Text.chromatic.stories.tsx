import React from "react";
import {
  TYPOGRAPHY_VARIANTS,
  TYPOGRAPHY_FONT_WEIGHTS,
} from "@appsmith/wds-theming";
import { Text, COLORS } from "@appsmith/wds";
import { StoryGrid } from "@design-system/storybook";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Text> = {
  component: Text,
  title: "Design System/Widgets/Text",
};

export default meta;

type Story = StoryObj<typeof Text>;

export const LightMode: Story = {
  storyName: "Text",
  render: () => (
    <StoryGrid cols="1">
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

      <Text textAlign="start">Text Align Left</Text>
      <Text textAlign="center">Text Align Center</Text>
      <Text textAlign="end">Text Align Right</Text>
      <Text isItalic>isItalic</Text>
      <Text isBold>isBold</Text>

      {Object.values(TYPOGRAPHY_VARIANTS).map((variant) => (
        <Text key={variant} size={variant}>
          variant — {variant}
        </Text>
      ))}

      {Object.values(COLORS).map((color) => (
        <Text color={color} key={color}>
          color — {color}
        </Text>
      ))}

      {Object.values(TYPOGRAPHY_FONT_WEIGHTS).map((fontWeight) => (
        <Text fontWeight={fontWeight} key={fontWeight}>
          fontWeight — {fontWeight}
        </Text>
      ))}
    </StoryGrid>
  ),
};

export const DarkMode: Story = Object.assign({}, LightMode);

DarkMode.parameters = {
  colorMode: "dark",
};
