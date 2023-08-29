import React from "react";
import DatasourceInformation from "./DatasourceSection";
import type { Datasource } from "entities/Datasource";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";

type Props = {
  formConfig: any[];
  datasource: Datasource | ApiDatasourceForm | undefined;
};
const DatasourceView = (props: Props) => {
  return (
    <DatasourceInformation
      config={props.formConfig[0]}
      datasource={props.datasource}
      viewMode
    />
  );
};

export default DatasourceView;
