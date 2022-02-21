import React, { useCallback, useState } from "react";
import { Action, ApiActionConfig, PluginType } from "entities/Action";
import styled from "styled-components";
import Button from "components/ads/Button";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import { Toaster } from "components/ads/Toast";
import { ERROR_ADD_API_INVALID_URL } from "@appsmith/constants/messages";
import { Classes, Variant } from "components/ads/common";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import { createActionRequest } from "actions/pluginActionActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getCurrentPageId } from "selectors/editorSelectors";
import { Datasource } from "entities/Datasource";

const ActionButton = styled(Button)`
  padding: 10px 10px;
  font-size: 12px;
  &&&& {
    height: 36px;
    width: 136px;
  }
  svg {
    width: 14px;
    height: 14px;
  }
  .${Classes.ICON} {
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

type NewActionButtonProps = {
  datasource?: Datasource;
  pluginType?: PluginType;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
};
function NewActionButton(props: NewActionButtonProps) {
  const { datasource, pluginType } = props;
  const [isSelected, setIsSelected] = useState(false);

  const dispatch = useDispatch();
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);

  const createQueryAction = useCallback(
    (e) => {
      e?.stopPropagation();
      if (
        pluginType === PluginType.API &&
        (!datasource ||
          !datasource.datasourceConfiguration ||
          !datasource.datasourceConfiguration.url)
      ) {
        Toaster.show({
          text: ERROR_ADD_API_INVALID_URL(),
          variant: Variant.danger,
        });
        return;
      }

      if (currentPageId) {
        setIsSelected(true);
        const newActionName =
          pluginType === PluginType.DB
            ? createNewQueryName(actions, currentPageId || "")
            : createNewApiName(actions, currentPageId || "");

        /* Removed Datasource Headers because they already exists in inherited headers so should not be duplicated to Newer APIs creation as datasource is already attached to it. While for older APIs we can start showing message on the UI from the API from messages key in Actions object. */
        const defaultApiActionConfig: ApiActionConfig = {
          ...DEFAULT_API_ACTION_CONFIG,
          headers: DEFAULT_API_ACTION_CONFIG.headers,
        };
        const payload = {
          name: newActionName,
          pageId: currentPageId,
          pluginId: datasource?.pluginId,
          datasource: {
            id: datasource?.id,
          },
          actionConfiguration:
            pluginType === PluginType.API ? defaultApiActionConfig : {},
          eventData: {
            actionType: pluginType === PluginType.DB ? "Query" : "API",
            from: props.eventFrom,
            dataSource: datasource?.name,
          },
        } as Partial<Action>;

        if (datasource) dispatch(createActionRequest(payload));
      }
    },
    [dispatch, actions, currentPageId, datasource, pluginType],
  );

  return (
    <ActionButton
      className="t--create-query"
      icon="plus"
      isLoading={isSelected || props.isLoading}
      onClick={createQueryAction}
      text={pluginType === PluginType.DB ? "New Query" : "New API"}
    />
  );
}

export default NewActionButton;
