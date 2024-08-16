import type { ReactNode } from "react";
import React from "react";
import { Flex } from "@appsmith/ads";
import { EDITOR_TABS_HEIGHT } from "../EditorPane/constants";

const Container = (props: { children: ReactNode }) => {
  return (
    <Flex
      alignItems="center"
      backgroundColor="#FFFFFF"
      borderBottom="1px solid var(--ads-v2-color-border-muted)"
      gap="spaces-2"
      id="ide-tabs-container"
      maxHeight={EDITOR_TABS_HEIGHT}
      minHeight={EDITOR_TABS_HEIGHT}
      px="spaces-2"
      width="100%"
    >
      {props.children}
    </Flex>
  );
};

export default Container;
