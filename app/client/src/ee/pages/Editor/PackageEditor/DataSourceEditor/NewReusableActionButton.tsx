import React, { useCallback, useState } from "react";
import { PluginType } from "entities/Action";
import { Button, toast } from "design-system";
import {
  createMessage,
  ERROR_ADD_API_INVALID_URL,
  NEW_REUSABLE_API_BUTTON_TEXT,
  NEW_REUSABLE_QUERY_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import type { Datasource } from "entities/Datasource";
import { noop } from "utils/AppsmithUtils";
import { getCurrentEnvironmentId } from "@appsmith/selectors/environmentSelectors";
import { createQueryModule } from "@appsmith/actions/moduleActions";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";

interface NewActionButtonProps {
  datasource?: Datasource;
  disabled?: boolean;
  packageName?: string;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
  pluginType?: string;
  style?: any;
  isNewQuerySecondaryButton?: boolean;
}
function NewReusableActionButton(props: NewActionButtonProps) {
  const { datasource, disabled, isNewQuerySecondaryButton, pluginType } = props;
  const [isSelected, setIsSelected] = useState(false);

  const dispatch = useDispatch();
  const packageId = useSelector(getCurrentPackageId) || "";
  const currentEnvironment = useSelector(getCurrentEnvironmentId);

  const createReusableQueryAction = useCallback(
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
          createQueryModule({
            datasourceId: datasource.id,
            type: MODULE_TYPE.QUERY,
            from: props.eventFrom as EventLocation,
            packageId,
          }),
        );
      }
    },
    [dispatch, datasource, pluginType, props.eventFrom, currentEnvironment],
  );

  return (
    <Button
      className="t--create-reusable-query"
      id={"create-reusable-query"}
      isDisabled={!!disabled}
      isLoading={isSelected || props.isLoading}
      kind={isNewQuerySecondaryButton ? "secondary" : "primary"}
      onClick={disabled ? noop : createReusableQueryAction}
      size="md"
      startIcon="plus"
    >
      {pluginType === PluginType.DB || pluginType === PluginType.SAAS
        ? createMessage(NEW_REUSABLE_QUERY_BUTTON_TEXT)
        : createMessage(NEW_REUSABLE_API_BUTTON_TEXT)}
    </Button>
  );
}

export default NewReusableActionButton;
