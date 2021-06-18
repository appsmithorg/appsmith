import React, { memo, ReactElement } from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import { jsIcon } from "../ExplorerIcons";
import { ExplorerURLParams, getJSActionIdFromURL } from "../helpers";
import { useParams } from "react-router";
import { JS_FUNCTION_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import history from "utils/history";
import ExplorerActionEntity from "./JSActionEntity";

type ExplorerJSActionGroupProps = {
  pageId: string;
  step: number;
  jsActions?: any;
  searchKeyword?: string;
};

export const ExplorerJSActionGroup = memo(
  (props: ExplorerJSActionGroupProps) => {
    const params = useParams<ExplorerURLParams>();
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
    const addJSAction = () => {
      history.push(
        JS_FUNCTION_URL_WITH_SELECTED_PAGE_ID(
          params.applicationId,
          props.pageId,
        ),
      );
    };
    return (
      <Entity
        className={"js_actions"}
        disabled={!props.jsActions && !!props.searchKeyword}
        entityId={props.pageId + "_jsAction"}
        icon={jsIcon}
        isDefaultExpanded
        key={props.pageId + "_jsAction"}
        name="JS Functions"
        onCreate={() => addJSAction()}
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
