import { AuthType, Datasource } from "entities/Datasource";
import React from "react";
import OAuth from "./OAuth";
import TestSaveDeleteAuth from "./TestSaveDeleteAuth";

interface Props {
  datasource: Datasource;
  getSanitizedFormData: () => Datasource;
  isInvalid: boolean;
  shouldRender: boolean;
}

function DatasourceAuth({
  datasource,
  getSanitizedFormData,
  isInvalid,
  shouldRender,
}: Props) {
  const authType =
    datasource.datasourceConfiguration.authentication?.authenticationType ||
    datasource.datasourceConfiguration.authentication?.authType;

  switch (authType) {
    case AuthType.OAUTH2:
      return (
        <OAuth
          datasource={datasource}
          getSanitizedFormData={getSanitizedFormData}
          isInvalid={isInvalid}
          shouldRender={shouldRender}
        />
      );

    case AuthType.DBAUTH:
      return (
        <TestSaveDeleteAuth
          datasource={datasource}
          getSanitizedFormData={getSanitizedFormData}
          isInvalid={isInvalid}
          shouldRender={shouldRender}
        />
      );

    default:
      return (
        <TestSaveDeleteAuth
          datasource={datasource}
          getSanitizedFormData={getSanitizedFormData}
          isInvalid={isInvalid}
          shouldRender={shouldRender}
        />
      );
  }
}

export default DatasourceAuth;
