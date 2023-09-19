import React from "react";
import { Checkbox, Text } from "design-system";
import { selectLibrariesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { useSelector } from "react-redux";

const CustomJSLibsExport = () => {
  const libraries = useSelector(selectLibrariesForExplorer);
  return (
    <div>
      <Text kind="heading-m" renderAs="h2">
        Custom JS Libs
      </Text>
      {libraries.map((lib) => (
        <Checkbox key={lib.name} name={lib.name}>
          {lib.name}
        </Checkbox>
      ))}
    </div>
  );
};

export default CustomJSLibsExport;
