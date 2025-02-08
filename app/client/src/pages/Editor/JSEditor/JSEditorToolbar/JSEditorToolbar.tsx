import React, { useState } from "react";
import { IDEToolbar, ToolbarSettingsPopover } from "IDE";
import { JSFunctionRun } from "./components/JSFunctionRun";
import type { JSActionDropdownOption, OnUpdateSettingsProps } from "./types";
import type { SaveActionNameParams } from "PluginActionEditor";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { DropdownOnSelect } from "@appsmith/ads-old";
import { createMessage, JS_EDITOR_SETTINGS } from "ee/constants/messages";
import { JSFunctionSettings } from "./components/JSFunctionSettings";
import { convertJSActionsToDropdownOptions } from "./utils";
import { JSObjectNameEditor } from "./JSObjectNameEditor";

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
  onUpdateSettings: (props: OnUpdateSettingsProps) => void;
  showNameEditor?: boolean;
  showSettings: boolean;
}

/**
 * JSEditorToolbar component.
 *
 * This component renders a toolbar for the JS editor.
 *
 */
export const JSEditorToolbar = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // Render the IDEToolbar with JSFunctionRun and JSFunctionSettings components
  return (
    <IDEToolbar>
      <IDEToolbar.Left>
        {props.showNameEditor && (
          <JSObjectNameEditor
            disabled={!props.changePermitted || props.hideEditIconOnEditor}
            saveJSObjectName={props.saveJSObjectName}
          />
        )}
      </IDEToolbar.Left>
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
          <ToolbarSettingsPopover
            dataTestId={"t--js-settings-trigger"}
            handleOpenChange={setIsOpen}
            isOpen={isOpen}
            title={createMessage(JS_EDITOR_SETTINGS.TITLE)}
          >
            <JSFunctionSettings
              actions={props.jsActions}
              disabled={!props.changePermitted}
              onUpdateSettings={props.onUpdateSettings}
            />
          </ToolbarSettingsPopover>
        ) : null}

        {props.hideContextMenuOnEditor ? null : props.contextMenu}
      </IDEToolbar.Right>
    </IDEToolbar>
  );
};
