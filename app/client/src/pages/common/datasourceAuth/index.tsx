import { AuthType, Datasource } from "entities/Datasource";
import React from "react";
import OAuth from "./OAuth";
import DefaultAuth from "./DefaultAuth";

interface Props {
  datasource: Datasource;
  formData: Datasource;
  getSanitizedFormData: () => Datasource;
  isInvalid: boolean;
  pageId?: string;
  shouldRender: boolean;
}

function DatasourceAuth({
  datasource,
  formData,
  getSanitizedFormData,
  isInvalid,
  pageId,
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
          pageId={pageId}
          shouldRender={shouldRender}
        />
      );

    case AuthType.DBAUTH:
      return (
        <DefaultAuth
          datasource={datasource}
          getSanitizedFormData={getSanitizedFormData}
          isInvalid={isInvalid}
          pageId={pageId}
          shouldRender={shouldRender}
        />
      );

    default:
      return (
        <DefaultAuth
          datasource={datasource}
          getSanitizedFormData={getSanitizedFormData}
          isInvalid={isInvalid}
          pageId={pageId}
          shouldRender={shouldRender}
        />
      );
  }
}

export default DatasourceAuth;
