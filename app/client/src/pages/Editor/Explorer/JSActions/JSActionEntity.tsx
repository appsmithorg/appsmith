import React, { ReactNode, memo, useCallback } from "react";
import Entity from "../Entity";
import EntityProperties from "../Entity/EntityProperties";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { JS_FUNCTION_ID_URL } from "constants/routes";
import history from "utils/history";
import { ExplorerURLParams } from "../helpers";
import { useParams } from "react-router";

type ExplorerJSActionEntityProps = {
  action: any;
  active: boolean;
  icon: ReactNode;
  step: number;
  searchKeyword?: string;
  pageId: string;
};

const getUpdateJSActionName = () => {
  console.log("update name");
};

export const ExplorerJSActionEntity = memo(
  (props: ExplorerJSActionEntityProps) => {
    const params = useParams<ExplorerURLParams>();
    const navigateToJSAction = useCallback(() => {
      history.push(
        JS_FUNCTION_ID_URL(
          params.applicationId,
          props.pageId,
          props.action.config.id,
          {},
        ),
      );
    }, [props.pageId]);
    return (
      <Entity
        action={navigateToJSAction}
        active={props.active}
        className="jsaction"
        entityId={props.action.config.id}
        icon={props.icon}
        key={props.action.config.id}
        name={props.action.config.name}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={getUpdateJSActionName}
      >
        <EntityProperties
          entity={props.action}
          entityId={props.action.config.id}
          entityName={props.action.config.name}
          entityType={ENTITY_TYPE.JSACTION}
          pageId={props.pageId}
          step={props.step + 1}
        />
      </Entity>
    );
  },
);

ExplorerJSActionEntity.displayName = "ExplorerActionEntity";

export default ExplorerJSActionEntity;
