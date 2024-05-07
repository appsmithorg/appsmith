import React from "react";

import CurlImportForm from "./CurlImportForm";
import { curlImportSubmitHandler } from "./helpers";
import { getNewEntityName } from "@appsmith/selectors/entitiesSelector";
import { getIsImportingCurl } from "selectors/ui";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import type { BuilderRouteParams } from "constants/routes";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import { DEFAULT_PREFIX } from "sagas/ActionSagas";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";

type CurlImportEditorProps = RouteComponentProps<BuilderRouteParams>;

function CurlImportEditor(props: CurlImportEditorProps) {
  const { pageId } = props.match.params;
  const actionName = useSelector((state) =>
    getNewEntityName(state, {
      prefix: DEFAULT_PREFIX.API,
      parentEntityId: pageId,
      parentEntityKey: CreateNewActionKey.PAGE,
    }),
  );

  const showDebugger = useSelector(showDebuggerFlag);
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
      showDebugger={showDebugger}
    />
  );
}

export default CurlImportEditor;
