import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Flex, Text } from "@appsmith/wds";
import styles from "./styles.module.css";

/**
 * The Flex component can be used to layout its children in one dimension with [flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Basic_Concepts_of_Flexbox). Any React component can be used as a child, and Flex components can be nested to create more complex layouts.
 *
 * In addition to the properties widely supported by CSS, we also shim the [gap](https://developer.mozilla.org/en-US/docs/Web/CSS/gap) property, along with [rowGap](https://developer.mozilla.org/en-US/docs/Web/CSS/row-gap) and [columnGap](https://developer.mozilla.org/en-US/docs/Web/CSS/column-gap). These properties make it much easier to build layouts with consistent space between each item.
 * The props of component can be defined with [sizing](/?path=/docs/design-system-theme-theme--sizing) and [spacing](http://localhost:6006/?path=/docs/design-system-theme-theme--spacing) dimension variables to ensure consistency across applications, and allow the layout to adapt to different devices automatically. In addition, these values can be autocompleted in many IDEs for convenience.
 */
const meta: Meta<typeof Flex> = {
  component: Flex,
  title: "WDS/Widgets/Flex",
};

export default meta;
type Story = StoryObj<typeof Flex>;

export const Main: Story = {
  args: {
    children: "Flex",
    gap: "spacing-6",
  },
  render: (args) => (
    <Flex {...args}>
      <div className={styles["demo-block"]} data-color="negative" />
      <div className={styles["demo-block"]} data-color="positive" />
      <div className={styles["demo-block"]} data-color="warning" />
    </Flex>
  ),
};

export const VerticalStack: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-2">
      <div className={styles["demo-block"]} data-color="negative" />
      <div className={styles["demo-block"]} data-color="positive" />
      <div className={styles["demo-block"]} data-color="warning" />
    </Flex>
  ),
};

export const HorizontalStack: Story = {
  render: () => (
    <Flex direction="column" gap="spacing-2" width="100%">
      <div className={styles["demo-block"]} data-color="accent" />
      <Flex gap="spacing-2" height="sizing-40">
        <div className={styles["demo-block"]} data-color="negative" />
        <div className={styles["demo-block"]} data-color="positive" />
        <div className={styles["demo-block"]} data-color="warning" />
      </Flex>
      <div className={styles["demo-block"]} data-color="warning" />
    </Flex>
  ),
};

/**
 *
 * The component interface supports `Responsive` props. Using such props, we can easily create responsive interfaces.
 * Specifying the props is based on the principle of **mobile first**, respectively, specifying `base` is applied for the smallest value, then breaking points are added.
 * It should also be taken into account that the break points indicate the width of the parent component and not the user's viewport because we use [container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries).
 * To make everything work, we just need to add `isContainer` prop to the parent FLex component.
 *
 * **Usage example**: `<Flex isContainer direction={{ base: "column", "520px": "row" }}>...</Flex>`
 */

export const ResponsiveCard: Story = {
  render: () => (
    <Flex gap="spacing-2" isContainer width="100%" wrap>
      {[...Array(12)].map((value) => (
        <Flex
          flex="1"
          key={value}
          minWidth={{
            base: "44%",
            "400px": "30%",
            "680px": "22%",
            "926px": "14%",
          }}
        >
          <div className={styles["responsive-block"]} />
        </Flex>
      ))}
    </Flex>
  ),
};

export const ResponsiveList: Story = {
  render: () => (
    <Flex
      direction={{ base: "row", "520px": "column" }}
      gap="spacing-6"
      isContainer
      wrap
    >
      {[...Array(4)].map((value) => (
        <Flex
          direction={{ base: "column", "520px": "row" }}
          flex={{ base: "0", "320px": "1", "520px": "none" }}
          gap="spacing-4"
          key={value}
          minWidth={{ base: "100%", "320px": "45%", "520px": "100%" }}
        >
          <Flex flex="1" maxWidth={{ base: "100%", "520px": "sizing-38" }}>
            <div className={styles["responsive-block"]} />
          </Flex>
          <Flex direction="column" flex="1" gap="spacing-4">
            <Text size="heading">Title</Text>
            <Text>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem
              consequuntur explicabo quia veniam? Aliquid amet cum delectus
              deleniti eligendi eum facilis, fugit in iusto nemo, porro quod
              reiciendis sint velit?
            </Text>
          </Flex>
        </Flex>
      ))}
    </Flex>
  ),
};
