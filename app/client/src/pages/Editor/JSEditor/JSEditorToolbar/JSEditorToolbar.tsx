import React from "react";
import { IDEToolbar } from "IDE";
import { JSFunctionRun } from "./components/JSFunctionRun";
import {
  convertJSActionsToDropdownOptions,
  type JSActionDropdownOption,
} from "../utils";
import type { SaveActionNameParams } from "PluginActionEditor";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { DropdownOnSelect } from "@appsmith/ads-old";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { JSHeader } from "./JSHeader";
import { JSFunctionSettings } from "./components/JSFunctionSettings";
import type { JSFunctionSettingsProps } from "./components/old/JSFunctionSettings";

interface Props {
  changePermitted: boolean;
  hideEditIconOnEditor?: boolean;
  saveJSObjectName: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
  hideContextMenuOnEditor?: boolean;
  contextMenu: React.ReactNode;
  disableRunFunctionality: boolean;
  executePermitted: boolean;
  loading: boolean;
  jsCollection: JSCollection;
  onButtonClick: (
    event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
  ) => void;
  onSelect: DropdownOnSelect;
  jsActions: JSAction[];
  selected: JSActionDropdownOption;
  onUpdateSettings: JSFunctionSettingsProps["onUpdateSettings"];
  showSettings: boolean;
}

export const JSEditorToolbar = (props: Props) => {
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  if (!isActionRedesignEnabled) {
    return <JSHeader {...props} />;
  }

  return (
    <IDEToolbar>
      <IDEToolbar.Left />
      <IDEToolbar.Right>
        <div className="t--formActionButtons">
          <JSFunctionRun
            disabled={props.disableRunFunctionality || !props.executePermitted}
            isLoading={props.loading}
            jsCollection={props.jsCollection}
            onButtonClick={props.onButtonClick}
            onSelect={props.onSelect}
            options={convertJSActionsToDropdownOptions(props.jsActions)}
            selected={props.selected}
            showTooltip={!props.selected.data}
          />
        </div>
        {props.showSettings ? (
          <JSFunctionSettings
            actions={props.jsActions}
            disabled={!props.changePermitted}
            onUpdateSettings={props.onUpdateSettings}
          />
        ) : null}

        {props.hideContextMenuOnEditor ? null : props.contextMenu}
      </IDEToolbar.Right>
    </IDEToolbar>
  );
};
