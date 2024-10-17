import React from "react";
import { IDEToolbar } from "IDE";
import { JSFunctionRun } from "./components/JSFunctionRun";
import type { JSActionDropdownOption } from "./types";
import type { SaveActionNameParams } from "PluginActionEditor";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { DropdownOnSelect } from "@appsmith/ads-old";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { JSHeader } from "./JSHeader";
import { JSFunctionSettings } from "./components/JSFunctionSettings";
import type { JSFunctionSettingsProps } from "./components/old/JSFunctionSettings";
import { convertJSActionsToDropdownOptions } from "./utils";

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

/**
 * JSEditorToolbar component.
 *
 * This component renders a toolbar for the JS editor. It conditionally renders
 * different components based on the `release_actions_redesign_enabled` feature flag.
 *
 */
export const JSEditorToolbar = (props: Props) => {
  // Check if the action redesign feature flag is enabled
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  // If the action redesign is not enabled, render the JSHeader component
  if (!isActionRedesignEnabled) {
    return <JSHeader {...props} />;
  }

  // Render the IDEToolbar with JSFunctionRun and JSFunctionSettings components
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
