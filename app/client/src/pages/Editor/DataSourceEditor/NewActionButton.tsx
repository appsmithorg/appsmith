import React, { useCallback, useState } from "react";
import { Action, ApiActionConfig, PluginType } from "entities/Action";
import styled from "styled-components";
import Button from "components/ads/Button";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import { Toaster } from "components/ads/Toast";
import { ERROR_ADD_API_INVALID_URL } from "constants/messages";
import { Classes, Variant } from "components/ads/common";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import { createActionRequest } from "actions/pluginActionActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { inOnboarding } from "sagas/OnboardingSagas";
import { getCurrentPageId } from "selectors/editorSelectors";
import { Datasource } from "entities/Datasource";

const ActionButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 36px;
    width: 136px;
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

  // Onboarding
  const isInOnboarding = useSelector(inOnboarding);
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

        const headers = datasource?.datasourceConfiguration?.headers ?? [];
        const defaultApiActionConfig: ApiActionConfig = {
          ...DEFAULT_API_ACTION_CONFIG,
          headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
        };
        let payload = {
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

        if (datasource)
          if (isInOnboarding) {
            // If in onboarding and tooltip is being shown
            payload = Object.assign({}, payload, {
              name: "fetch_standup_updates",
              actionConfiguration: {
                body:
                  "Select avatar, name, notes from standup_updates order by id desc",
              },
            });
          }

        dispatch(createActionRequest(payload));
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
