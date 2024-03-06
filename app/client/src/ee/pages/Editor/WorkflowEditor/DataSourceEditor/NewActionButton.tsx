import React, { useCallback, useState } from "react";
import { PluginType } from "entities/Action";
import { Button, toast } from "design-system";
import {
  createMessage,
  ERROR_ADD_API_INVALID_URL,
  NEW_API_BUTTON_TEXT,
  NEW_QUERY_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import type { Datasource } from "entities/Datasource";
import { noop } from "utils/AppsmithUtils";
import { getCurrentEnvironmentId } from "@appsmith/selectors/environmentSelectors";
import { getCurrentWorkflowId } from "@appsmith/selectors/workflowSelectors";
import { createWorkflowQueryAction } from "@appsmith/actions/workflowActions";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";

interface NewActionButtonProps {
  datasource?: Datasource;
  disabled?: boolean;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
  pluginType?: string;
  style?: any;
  isNewQuerySecondaryButton?: boolean;
}
function NewActionButton(props: NewActionButtonProps) {
  const { datasource, disabled, isNewQuerySecondaryButton, pluginType } = props;
  const [isSelected, setIsSelected] = useState(false);

  const dispatch = useDispatch();
  const workflowId = useSelector(getCurrentWorkflowId) || "";
  const currentEnvironment = useSelector(getCurrentEnvironmentId);

  const createQueryActionInWorkflows = useCallback(
    (e) => {
      e?.stopPropagation();
      if (
        pluginType === PluginType.API &&
        (!datasource ||
          !datasource.datasourceStorages[currentEnvironment]
            .datasourceConfiguration ||
          !datasource.datasourceStorages[currentEnvironment]
            .datasourceConfiguration.url)
      ) {
        toast.show(ERROR_ADD_API_INVALID_URL(), {
          kind: "error",
        });
        return;
      }

      setIsSelected(true);
      if (datasource) {
        dispatch(
          createWorkflowQueryAction(
            workflowId,
            props.eventFrom as EventLocation,
            datasource.id,
          ),
        );
      }
    },
    [dispatch, datasource, pluginType, props.eventFrom, currentEnvironment],
  );

  return (
    <Button
      className="t--create-query-in-workflow-editor"
      id={"create-reusable-query"}
      isDisabled={!!disabled}
      isLoading={isSelected || props.isLoading}
      kind={isNewQuerySecondaryButton ? "secondary" : "primary"}
      onClick={disabled ? noop : createQueryActionInWorkflows}
      size="md"
      startIcon="plus"
    >
      {pluginType === PluginType.DB || pluginType === PluginType.SAAS
        ? createMessage(NEW_QUERY_BUTTON_TEXT)
        : createMessage(NEW_API_BUTTON_TEXT)}
    </Button>
  );
}

export default NewActionButton;
