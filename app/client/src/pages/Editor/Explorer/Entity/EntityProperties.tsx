import React, { useCallback, useEffect } from "react";
import EntityProperty from "./EntityProperty";
import { isFunction } from "lodash";
import type { EntityDefinitionsOptions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import {
  entityDefinitions,
  getPropsForJSActionEntity,
} from "@appsmith/utils/autocomplete/EntityDefinitions";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { useDispatch, useSelector } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import type { AppState } from "@appsmith/reducers";
import { isEmpty } from "lodash";
import { getCurrentPageId } from "selectors/editorSelectors";
import classNames from "classnames";
import styled from "styled-components";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { EntityClassNames } from ".";
import { Button } from "design-system";
import WidgetFactory from "WidgetProvider/factory";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";

// const CloseIcon = ControlIcons.CLOSE_CONTROL;

const BindingContainerMaxHeight = 300;
const EntityHeight = 36;
const BottomBarHeight = 34;

const EntityInfoContainer = styled.div`
  min-width: 220px;
  max-width: 400px;
  max-height: ${BindingContainerMaxHeight}px;
  overflow-y: hidden;
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border-muted);
  box-shadow: var(--ads-v2-shadow-popovers);
`;

const selectEntityInfo = (state: AppState) => state.ui.explorer.entityInfo;

const getJSActionBindings = (
  entity: JSCollectionData,
  entityProperties: any,
  entityType: string,
) => {
  const jsCollection = entity as JSCollectionData;
  const properties = getPropsForJSActionEntity(jsCollection);
  if (properties) {
    entityProperties = Object.keys(properties).map((actionProperty: string) => {
      const value = properties[actionProperty];
      return {
        propertyName: actionProperty,
        entityName: jsCollection.config.name,
        value: value,
        entityType,
      };
    });
  }
  return entityProperties;
};

const getActionBindings = (
  entity: any,
  entityDefinitions: any,
  entityProperties: any,
  entityType: string,
  entityName?: string,
) => {
  const config = (entityDefinitions.ACTION as any)(entity as any);

  if (config) {
    entityProperties = Object.keys(config)
      .filter((k) => k.indexOf("!") === -1)
      .map((actionProperty: string) => {
        let value = entity[actionProperty];
        if (actionProperty === "isLoading") {
          value = entity.isLoading;
        }
        if (actionProperty === "run") {
          value = "Function";
          actionProperty = actionProperty + "()";
        }
        if (actionProperty === "clear") {
          value = "Function";
          actionProperty = actionProperty + "()";
        }
        if (actionProperty === "data") {
          if (isEmpty(entity.data) || !entity.data.hasOwnProperty("body")) {
            value = {};
          } else {
            value = entity.data.body;
          }
        }
        return {
          propertyName: actionProperty,
          entityName: entityName,
          value,
          entityType,
        };
      });
  }
  return entityProperties;
};

export function EntityProperties() {
  const ref = React.createRef<HTMLDivElement>();
  const dispatch = useDispatch();
  const { entityId, entityName, entityType, show } =
    useSelector(selectEntityInfo);
  const pageId = useSelector(getCurrentPageId) || "";
  PerformanceTracker.startTracking(
    PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
  );
  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
    );
  });
  const widgetEntity = useSelector((state: AppState) => {
    const pageWidgets = state.ui.pageWidgets[pageId]?.dsl;
    if (pageWidgets) {
      return pageWidgets[entityId];
    }
  });

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);

    return () => document.removeEventListener("click", handleOutsideClick);
  }, [show]);

  useEffect(() => {
    if (entityId) {
      AnalyticsUtil.logEvent("SHOW_BINDINGS_TRIGGERED", {
        entityName,
        entityType,
      });
    }
  }, [entityId]);

  const actionEntity = useSelector((state: AppState) =>
    state.entities.actions.find((action) => action.config.id === entityId),
  );

  const jsActionEntity = useSelector((state: AppState) =>
    state.entities.jsActions.find((js) => js.config.id === entityId),
  );

  const moduleInstanceQueryEntity = useSelector(
    (state: AppState) =>
      state.entities.moduleInstanceEntities?.actions?.find(
        (action: ActionData) => action.config.moduleInstanceId === entityId,
      ),
  );

  const moduleInstanceJSEntity = useSelector(
    (state: AppState) =>
      state.entities.moduleInstanceEntities?.jsCollections?.find(
        (action: JSCollectionData) =>
          action.config.moduleInstanceId === entityId,
      ),
  );

  const closeContainer = useCallback((e) => {
    e.stopPropagation();
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: { show: false },
    });
  }, []);

  const handleOutsideClick = (e: MouseEvent) => {
    const appBody = document.getElementById("app-body") as HTMLElement;
    const paths = e.composedPath();
    if (
      ref &&
      ref.current &&
      !paths?.includes(appBody) &&
      !paths?.includes(ref.current)
    )
      closeContainer(e);
  };

  useEffect(() => {
    const element = document.getElementById(`entity-${entityId}`);
    const rect = element?.getBoundingClientRect();
    if (ref.current && rect) {
      const top = rect?.top;
      let bottom;
      if (
        top + BindingContainerMaxHeight >
        window.innerHeight - BottomBarHeight
      ) {
        bottom = window.innerHeight - rect?.bottom - EntityHeight;
      }
      if (bottom) {
        ref.current.style.bottom = bottom + "px";
        ref.current.style.top = "unset";
      } else {
        ref.current.style.top = top - EntityHeight + "px";
        ref.current.style.bottom = "unset";
      }
      ref.current.style.left = (rect ? rect?.width ?? 0 : 0) + "px";
    }
  }, [entityId]);

  const entity: any =
    widgetEntity ||
    actionEntity ||
    jsActionEntity ||
    moduleInstanceQueryEntity ||
    moduleInstanceJSEntity;
  let entityProperties: any = [];

  if (!entity) return null;
  switch (entityType) {
    case ENTITY_TYPE.JSACTION:
      entityProperties = getJSActionBindings(
        entity,
        entityProperties,
        entityType,
      );
      break;
    case ENTITY_TYPE.ACTION:
      entityProperties = getActionBindings(
        entity,
        entityDefinitions,
        entityProperties,
        entityType,
        entityName,
      );
      break;
    case ENTITY_TYPE.WIDGET:
      const type: Exclude<
        EntityDefinitionsOptions,
        | "CANVAS_WIDGET"
        | "ICON_WIDGET"
        | "SKELETON_WIDGET"
        | "TABS_MIGRATOR_WIDGET"
      > = entity.type;
      let config = WidgetFactory.getAutocompleteDefinitions(type);
      if (!config) {
        return null;
      }

      if (isFunction(config)) config = config(entity);
      const settersConfig =
        WidgetFactory.getWidgetSetterConfig(type)?.__setters;

      entityProperties = Object.keys(config)
        .filter((k) => k.indexOf("!") === -1)
        .filter((k) => settersConfig && !settersConfig[k])
        .map((widgetProperty) => {
          return {
            propertyName: widgetProperty,
            entityName: entity.widgetName,
            value: entity[widgetProperty],
            entityType,
          };
        });
      break;
    case ENTITY_TYPE.MODULE_INSTANCE:
      if (moduleInstanceQueryEntity) {
        entityProperties = getActionBindings(
          moduleInstanceQueryEntity,
          entityDefinitions,
          entityProperties,
          entityType,
          entityName,
        );
      } else if (moduleInstanceJSEntity) {
        entityProperties = getJSActionBindings(
          moduleInstanceJSEntity,
          entityProperties,
          entityType,
        );
      }
      break;
  }
  return (
    <EntityInfoContainer
      className={classNames({
        "absolute bp3-popover overflow-y-auto overflow-x-hidden bg-white pb-2 flex flex-col justify-center z-10 delay-150 transition-all":
          true,
        "-left-100": !show,
        [EntityClassNames.CONTEXT_MENU_CONTENT]: true,
      })}
      ref={ref}
    >
      <div className="h-auto overflow-y-auto overflow-x-hidden relative">
        <div className="sticky top-0 text-sm px-3 z-5 pt-2 pb-1 font-medium flex flex-row items-center justify-between w-[100%]">
          Bindings
          <Button
            className="t--entity-property-close"
            isIconButton
            kind="tertiary"
            onClick={closeContainer}
            size="sm"
            startIcon="close-control"
          />
        </div>
        {entityProperties.map((entityProperty: any) => (
          <EntityProperty
            key={entityProperty.propertyName}
            {...entityProperty}
          />
        ))}
      </div>
    </EntityInfoContainer>
  );
}

export default Sentry.withProfiler(EntityProperties);
