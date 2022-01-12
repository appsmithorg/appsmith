import { AuthType, Datasource } from "entities/Datasource";
import React from "react";
import OAuth from "./OAuth";
import DefaultAuth from "./DefaultAuth";

interface Props {
  datasource: Datasource;
  formData: Datasource;
  getSanitizedFormData: () => Datasource;
  isInvalid: boolean;
  shouldRender: boolean;
}

function DatasourceAuth({
  datasource,
  formData,
  getSanitizedFormData,
  isInvalid,
  shouldRender,
}: Props) {
  const authType =
    formData &&
    formData.datasourceConfiguration?.authentication?.authenticationType;

  // Render call-to-actions depending on the datasource authentication type

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
        <DefaultAuth
          datasource={datasource}
          getSanitizedFormData={getSanitizedFormData}
          isInvalid={isInvalid}
          shouldRender={shouldRender}
        />
      );

    default:
      return (
        <DefaultAuth
          datasource={datasource}
          getSanitizedFormData={getSanitizedFormData}
          isInvalid={isInvalid}
          shouldRender={shouldRender}
        />
      );
  }
}

export default DatasourceAuth;
