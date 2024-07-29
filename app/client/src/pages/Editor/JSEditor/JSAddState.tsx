import React from "react";
import { Flex } from "design-system";
import AddJS from "pages/Editor/IDE/EditorPane/JS/Add";
import { EDITOR_TABS_HEIGHT } from "../IDE/EditorPane/constants";

const JSAddState = () => {
  return (
    <Flex height={`calc(100% - ${EDITOR_TABS_HEIGHT})`} justifyContent="center">
      <AddJS
        containerProps={{
          px: "spaces-4",
          py: "spaces-7",
        }}
        innerContainerProps={{
          minWidth: "30vw",
        }}
      />
    </Flex>
  );
};

export { JSAddState };
