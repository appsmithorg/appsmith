import React, { memo, ReactElement } from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import { jsIcon } from "../ExplorerIcons";
import { getJSActionIdFromURL } from "../helpers";
import ExplorerActionEntity from "./JSActionEntity";
import { createNewJSAction } from "actions/jsPaneActions";
import { useDispatch } from "react-redux";

type ExplorerJSActionGroupProps = {
  pageId: string;
  step: number;
  jsActions?: any;
  searchKeyword?: string;
};

export const ExplorerJSActionGroup = memo(
  (props: ExplorerJSActionGroupProps) => {
    const emptyNode = (
      <EntityPlaceholder step={props.step + 1}>
        No JS Functions yet. Please click the <strong>+</strong> icon on above,
        to create.
      </EntityPlaceholder>
    );
    const childNode: ReactElement<ExplorerJSActionGroupProps> = (
      <>
        {props.jsActions.map((js: any) => {
          const jsactionId = getJSActionIdFromURL();
          const active = jsactionId === js.config.id;
          return (
            <ExplorerActionEntity
              action={js}
              active={active}
              icon={jsIcon}
              key={js.config.id}
              pageId={props.pageId}
              searchKeyword={props.searchKeyword}
              step={props.step + 1}
            />
          );
        })}
      </>
    );
    const dispatch = useDispatch();
    return (
      <Entity
        className={"js_actions"}
        disabled={!props.jsActions && !!props.searchKeyword}
        entityId={props.pageId + "_jsAction"}
        icon={jsIcon}
        isDefaultExpanded
        key={props.pageId + "_jsAction"}
        name="JS Functions"
        onCreate={() => dispatch(createNewJSAction(props.pageId))}
        searchKeyword={props.searchKeyword}
        step={props.step}
      >
        {!props.jsActions?.length ? emptyNode : childNode}
      </Entity>
    );
  },
);

ExplorerJSActionGroup.displayName = "ExplorerJSActionGroup";
(ExplorerJSActionGroup as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default ExplorerJSActionGroup;
