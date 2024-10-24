import React from "react";
import { JSFunctionRun } from "./components/JSFunctionRun";
import type { JSActionDropdownOption } from "./types";
import { ActionButtons, NameWrapper, StyledFormRow } from "../styledComponents";
import type { SaveActionNameParams } from "PluginActionEditor";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { DropdownOnSelect } from "@appsmith/ads-old";
import { JSObjectNameEditor } from "../JSObjectNameEditor";
import { Flex } from "@appsmith/ads";
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
}

export const JSHeader = (props: Props) => {
  return (
    <Flex paddingTop="spaces-5">
      <StyledFormRow className="form-row-header">
        <NameWrapper className="t--nameOfJSObject">
          <JSObjectNameEditor
            disabled={!props.changePermitted || props.hideEditIconOnEditor}
            saveJSObjectName={props.saveJSObjectName}
          />
        </NameWrapper>
        <ActionButtons className="t--formActionButtons">
          {!props.hideContextMenuOnEditor && props.contextMenu}
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
        </ActionButtons>
      </StyledFormRow>
    </Flex>
  );
};
