import React from "react";
import { Flex } from "design-system";
import AddJS from "pages/Editor/IDE/EditorPane/JS/Add";

const JSAddState = () => {
  return (
    <Flex height="100%" justifyContent="center">
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
