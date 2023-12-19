import * as React from "react";
import { Flex } from "@design-system/widgets";

export const Elevation = () => {
  return (
    <Flex
      direction="column"
      padding="spacing-6"
      style={{
        background: "var(--color-bg-elevation-1)",
        boxShadow: "var(--box-shadow-1)",
      }}
    >
      <Flex
        direction="column"
        padding="spacing-6"
        style={{
          background: "var(--color-bg-elevation-2)",
          boxShadow: "var(--box-shadow-2)",
        }}
      >
        <Flex
          direction="column"
          padding="spacing-6"
          style={{
            background: "var(--color-bg-elevation-3)",
            boxShadow: "var(--box-shadow-1)",
          }}
        />
      </Flex>
    </Flex>
  );
};
