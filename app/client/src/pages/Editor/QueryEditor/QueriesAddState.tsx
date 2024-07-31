import React from "react";
import { Flex } from "design-system";
import AddQuery from "pages/Editor/IDE/EditorPane/Query/Add";
import { EDITOR_TABS_HEIGHT } from "../IDE/EditorPane/constants";

const QueriesAddState = () => {
  return (
    <Flex height={`calc(100% - ${EDITOR_TABS_HEIGHT})`} justifyContent="center">
      <AddQuery
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

export { QueriesAddState };
