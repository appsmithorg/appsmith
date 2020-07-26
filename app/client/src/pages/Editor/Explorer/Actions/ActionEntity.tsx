import React, { ReactNode } from "react";
import Entity, { EntityClassNames } from "../Entity";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import history from "utils/history";
import { GenericAction } from "@appsmith/entities/Action";
import { noop } from "lodash";
import { saveActionName } from "actions/actionActions";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import EntityProperty from "../Entity/EntityProperty";

const getUpdateActionNameReduxAction = (id: string, name: string) => {
  return saveActionName({ id, name });
};

const getActionProperties = (action: any, step: number) => {
  const config = entityDefinitions.ACTION(action);

  return (
    config &&
    Object.keys(config)
      .filter(k => k.indexOf("!") === -1)
      .map((actionProperty: string) => {
        let value = action[actionProperty];
        if (actionProperty === "run") {
          value = "Function";
          actionProperty = actionProperty + "()";
        }
        if (actionProperty === "data") {
          value = action.data;
        }
        return (
          <EntityProperty
            key={actionProperty}
            propertyName={actionProperty}
            entityName={action.name}
            value={value}
            step={step}
          />
        );
      })
  );
};

type ExplorerActionEntityProps = {
  action: GenericAction;
  url: string;
  icon: ReactNode;
  active: boolean;
  step: number;
  searchKeyword?: string;
  pageId: string;
};

export const ExplorerActionEntity = (props: ExplorerActionEntityProps) => {
  return (
    <Entity
      key={props.action.actionId}
      icon={props.icon}
      name={props.action.name}
      action={props.url ? () => history.push(props.url) : noop}
      isDefaultExpanded={props.active}
      active={props.active}
      entityId={props.action.actionId}
      step={props.step}
      updateEntityName={getUpdateActionNameReduxAction}
      searchKeyword={props.searchKeyword}
      contextMenu={
        <ActionEntityContextMenu
          id={props.action.actionId}
          name={props.action.name}
          className={EntityClassNames.ACTION_CONTEXT_MENU}
          pageId={props.pageId}
        />
      }
    >
      {getActionProperties(props.action, props.step + 1)}
    </Entity>
  );
};

export default ExplorerActionEntity;
