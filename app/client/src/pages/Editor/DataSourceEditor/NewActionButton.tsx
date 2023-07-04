import React, { useCallback, useState } from "react";
import { PluginType } from "entities/Action";
import { Button, toast } from "design-system";
import {
  createMessage,
  ERROR_ADD_API_INVALID_URL,
  NEW_API_BUTTON_TEXT,
  NEW_QUERY_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import { createNewQueryAction } from "actions/apiPaneActions";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { Datasource } from "entities/Datasource";
import type { EventLocation } from "utils/AnalyticsUtil";
import { noop } from "utils/AppsmithUtils";
import { getCurrentEnvironment } from "@appsmith/utils/Environments";

type NewActionButtonProps = {
  datasource?: Datasource;
  disabled?: boolean;
  packageName?: string;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
  pluginType?: string;
  style?: any;
};
function NewActionButton(props: NewActionButtonProps) {
  const { datasource, disabled, pluginType } = props;
  const [isSelected, setIsSelected] = useState(false);

  const dispatch = useDispatch();
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);
  const currentEnvironment = getCurrentEnvironment();

  const createQueryAction = useCallback(
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

      if (currentPageId) {
        setIsSelected(true);
        if (datasource) {
          dispatch(
            createNewQueryAction(
              currentPageId,
              props.eventFrom as EventLocation,
              datasource?.id,
            ),
          );
        }
      }
    },
    [dispatch, actions, currentPageId, datasource, pluginType],
  );

  return (
    <Button
      className="t--create-query"
      isDisabled={!!disabled}
      isLoading={isSelected || props.isLoading}
      onClick={disabled ? noop : createQueryAction}
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
