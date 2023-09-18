import { Checkbox, Text } from "design-system";
import { useAppWideAndOtherDatasource } from "pages/Editor/Explorer/hooks";
import React from "react";

const DatasourcesExport = () => {
  const { appWideDS } = useAppWideAndOtherDatasource();

  return (
    <div>
      <Text kind="heading-m" renderAs="h2">
        Data sources
      </Text>
      {appWideDS.map((ds) => (
        <Checkbox key={ds.id}>{ds.name}</Checkbox>
      ))}
    </div>
  );
};

export default DatasourcesExport;
