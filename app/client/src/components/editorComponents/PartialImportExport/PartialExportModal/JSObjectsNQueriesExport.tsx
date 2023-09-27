import { selectFilesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { Checkbox } from "design-system";
import React from "react";
import { useSelector } from "react-redux";

const JSObjectsNQueriesExport = () => {
  const files = useSelector(selectFilesForExplorer);
  return (
    <div>
      {files.map(({ entity, type }: any) => {
        switch (type) {
          case "JS":
            return <Checkbox key={entity.id}>{entity.name}</Checkbox>;
          // case "group":
          //   return (
          //     <Text kind="heading-m" renderAs="h2">
          //       {entity.name}
          //     </Text>
          //   );
          default:
            return <Checkbox key={entity.id}>{entity.name}</Checkbox>;
        }
      })}
    </div>
  );
};

export default JSObjectsNQueriesExport;
