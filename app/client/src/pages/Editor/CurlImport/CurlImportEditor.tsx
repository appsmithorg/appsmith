import React from "react";

import CurlImportForm from "./CurlImportForm";
import {
  getCurrentPageId,
  getNewEntityName,
} from "@appsmith/selectors/entitiesSelector";
import { getIsImportingCurl } from "selectors/ui";
import { useSelector } from "react-redux";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { DEFAULT_PREFIX } from "sagas/ActionSagas";
import { curlImportSubmitHandler } from "./helpers";

function CurlImportEditor() {
  const pageId = useSelector(getCurrentPageId);
  const actionName = useSelector((state) =>
    getNewEntityName(state, {
      prefix: DEFAULT_PREFIX.API,
      parentEntityId: pageId,
      parentEntityKey: CreateNewActionKey.PAGE,
    }),
  );

  const isImportingCurl = useSelector(getIsImportingCurl);

  const initialFormValues = {
    contextId: pageId,
    contextType: ActionParentEntityType.PAGE,
    name: actionName,
  };

  return (
    <CurlImportForm
      curlImportSubmitHandler={curlImportSubmitHandler}
      initialValues={initialFormValues}
      isImportingCurl={isImportingCurl}
    />
  );
}

export default CurlImportEditor;
