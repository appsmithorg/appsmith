import * as React from "react";
import { Flex, Button } from "@design-system/widgets";

export const Elevation = () => {
  return (
    <Flex
      direction="column"
      padding="spacing-6"
      style={{
        background: "var(--color-bg-elevation-1)",
        boxShadow: "var(--box-shadow-1)",
        // borderRadius: "calc(var(--border-radius-1) + var(--outer-spacing-6)*2)",
        borderRadius: "var(--border-radius-1)",
      }}
    >
      <Flex
        direction="column"
        padding="spacing-6"
        style={{
          background: "var(--color-bg-elevation-2)",
          boxShadow: "var(--box-shadow-2)",
          // borderRadius: "calc(var(--border-radius-1) + var(--outer-spacing-6))",
          borderRadius: "var(--border-radius-1)",
        }}
      >
        <Flex
          direction="column"
          padding="spacing-6"
          style={{
            background: "var(--color-bg-elevation-3)",
            boxShadow: "var(--box-shadow-3)",
            borderRadius: "var(--border-radius-1)",
          }}
        >
          <Button>Do the Thing</Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
