import React, { useCallback, useState } from "react";
import { PluginType } from "entities/Action";
import styled from "styled-components";
import {
  Button,
  Classes,
  IconPositions,
  Toaster,
  Variant,
} from "design-system";
import { ERROR_ADD_API_INVALID_URL } from "@appsmith/constants/messages";
import { createNewQueryAction } from "actions/apiPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { getCurrentPageId } from "selectors/editorSelectors";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import { EventLocation } from "utils/AnalyticsUtil";

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
  disabled?: boolean;
  packageName?: string;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
  plugin?: Plugin;
};
function NewActionButton(props: NewActionButtonProps) {
  const { datasource, disabled, plugin } = props;
  const pluginType = plugin?.type;
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
    <ActionButton
      className="t--create-query"
      disabled={disabled}
      icon="plus"
      iconPosition={IconPositions.left}
      isLoading={isSelected || props.isLoading}
      onClick={createQueryAction}
      tag="button"
      text={pluginType === PluginType.DB ? "New Query" : "New API"}
    />
  );
}

export default NewActionButton;
