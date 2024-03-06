import React, { useMemo } from "react";

import { getNewEntityName } from "@appsmith/selectors/entitiesSelector";
import { getIsImportingCurl } from "selectors/ui";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import CloseEditor from "components/editorComponents/CloseEditor";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import { DEFAULT_PREFIX } from "sagas/ActionSagas";
import CurlImportForm from "pages/Editor/APIEditor/CurlImportForm";
import { curlImportSubmitHandler } from "pages/Editor/APIEditor/helpers";
import { useIsEditorPaneSegmentsEnabled } from "pages/Editor/IDE/hooks";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";

type CurlImportEditorProps = RouteComponentProps<{ workflowId: string }>;

function WorkflowCurlImportEditor(props: CurlImportEditorProps) {
  const { workflowId } = props.match.params;
  const actionName = useSelector((state) =>
    getNewEntityName(state, {
      prefix: DEFAULT_PREFIX.API,
      parentEntityId: workflowId || "",
      parentEntityKey: CreateNewActionKey.WORKFLOW,
    }),
  );

  const showDebugger = useSelector(showDebuggerFlag);
  const isImportingCurl = useSelector(getIsImportingCurl);

  const initialFormValues = {
    contextId: workflowId,
    contextType: ActionParentEntityType.WORKFLOW,
    name: actionName,
  };
  const isEditorPaneEnabled = useIsEditorPaneSegmentsEnabled();

  const closeEditorLink = useMemo(() => <CloseEditor />, []);

  return (
    <CurlImportForm
      closeEditorLink={isEditorPaneEnabled ? null : closeEditorLink}
      curlImportSubmitHandler={curlImportSubmitHandler}
      initialValues={initialFormValues}
      isImportingCurl={isImportingCurl}
      showDebugger={showDebugger}
    />
  );
}

export default WorkflowCurlImportEditor;
