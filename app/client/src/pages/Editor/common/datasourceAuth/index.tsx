import { AuthType, Datasource } from "entities/Datasource";
import React from "react";
import OAuth from "./OAuth";
import TestSaveDeleteAuth from "./TestSaveDeleteAuth";

interface Props {
  datasource: Datasource;
  sanitizedFormData: Datasource;
  isInvalid: boolean;
}

function DatasourceAuth({ datasource, isInvalid, sanitizedFormData }: Props) {
  const authType =
    datasource.datasourceConfiguration.authentication?.authenticationType ||
    datasource.datasourceConfiguration.authentication?.authType;

  switch (authType) {
    case AuthType.OAUTH2:
      return (
        <OAuth
          datasource={datasource}
          isInvalid={isInvalid}
          sanitizedFormData={sanitizedFormData}
        />
      );

    case AuthType.DBAUTH:
      return (
        <TestSaveDeleteAuth
          datasource={datasource}
          isInvalid={isInvalid}
          sanitizedFormData={sanitizedFormData}
        />
      );

    default:
      return (
        <TestSaveDeleteAuth
          datasource={datasource}
          isInvalid={isInvalid}
          sanitizedFormData={sanitizedFormData}
        />
      );
  }
}

export default DatasourceAuth;
