import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Text,
} from "design-system";
import React from "react";
import EntityCheckboxSelector from "./EntityCheckboxSelector";

interface Props {
  data: Record<
    string,
    {
      type: string;
      group: string;
      entity: {
        id: string;
        name: string;
      };
    }[]
  >;
}
const JSObjectsNQueriesExport = ({ data }: Props) => {
  return (
    <div className="pl-4 pr-4">
      {Object.keys(data).map((key) => (
        <Collapsible isOpen key={key}>
          <CollapsibleHeader>
            <Text
              kind="heading-s"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {key}
            </Text>
          </CollapsibleHeader>
          <CollapsibleContent>
            <EntityCheckboxSelector
              entities={data[key].map((item) => item.entity)}
            />
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default JSObjectsNQueriesExport;
