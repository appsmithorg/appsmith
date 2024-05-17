import React from "react";
import { Flex } from "design-system";
import AddQuery from "pages/Editor/IDE/EditorPane/Query/Add";

const QueriesAddState = () => {
  return (
    <Flex justifyContent="center">
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
