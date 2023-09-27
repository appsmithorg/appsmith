import { selectLibrariesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { Checkbox } from "design-system";
import React from "react";
import { useSelector } from "react-redux";

const CustomJSLibsExport = () => {
  const libraries = useSelector(selectLibrariesForExplorer);
  return (
    <div>
      {libraries.map((lib) => (
        <Checkbox key={lib.name} name={lib.name}>
          {lib.name}
        </Checkbox>
      ))}
    </div>
  );
};

export default CustomJSLibsExport;
