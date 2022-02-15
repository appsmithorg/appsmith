import React, { useCallback, useEffect } from "react";
import EntityProperty from "./EntityProperty";
import { isFunction } from "lodash";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { WidgetType } from "constants/WidgetConstants";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { useDispatch, useSelector } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { AppState } from "reducers";
import { getPropsForJSActionEntity } from "utils/autocomplete/EntityDefinitions";
import { isEmpty } from "lodash";
import { getCurrentPageId } from "selectors/editorSelectors";
import classNames from "classnames";
import { JSCollection } from "entities/JSCollection";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

const CloseIcon = ControlIcons.CLOSE_CONTROL;

const BindingContainerMaxHeight = 300;
const EntityHeight = 36;
const BottomBarHeight = 34;

const EntityInfoContainer = styled.div`
  min-width: 220px;
  max-width: 400px;
  max-height: ${BindingContainerMaxHeight}px;
  overflow-y: hidden;
  border: 1px solid rgba(229, 231, 235, var(--tw-border-opacity));
  box-shadow: 4px 0px 10px 2px #ebebeb;
`;

const selectEntityInfo = (state: AppState) => state.ui.explorer.entityInfo;

export function EntityProperties() {
  const ref = React.createRef<HTMLDivElement>();
  const dispatch = useDispatch();
  const { entityId, entityName, entityType, show } = useSelector(
    selectEntityInfo,
  );
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
    const pageWidgets = state.ui.pageWidgets[pageId];
    if (pageWidgets) {
      return pageWidgets[entityId];
    }
  });

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);

    return () => document.removeEventListener("click", handleOutsideClick);
  }, [show]);

  const actionEntity = useSelector((state: AppState) =>
    state.entities.actions.find((action) => action.config.id === entityId),
  );

  const jsActionEntity = useSelector((state: AppState) =>
    state.entities.jsActions.find((js) => js.config.id === entityId),
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
    const element = document.getElementById(entityId);
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

  const entity: any = widgetEntity || actionEntity || jsActionEntity;
  let config: any;
  let entityProperties: any = [];

  if (!entity) return null;
  switch (entityType) {
    case ENTITY_TYPE.JSACTION:
      const jsAction = entity.config as JSCollection;
      const properties = getPropsForJSActionEntity(jsAction);
      if (properties) {
        entityProperties = Object.keys(properties).map(
          (actionProperty: string) => {
            const value = properties[actionProperty];
            return {
              propertyName: actionProperty,
              entityName: jsAction.name,
              value: value,
            };
          },
        );
      }
      break;
    case ENTITY_TYPE.ACTION:
      config = (entityDefinitions.ACTION as any)(entity as any);
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
            };
          });
      }
      break;
    case ENTITY_TYPE.WIDGET:
      const type: Exclude<
        Partial<WidgetType>,
        | "CANVAS_WIDGET"
        | "ICON_WIDGET"
        | "SKELETON_WIDGET"
        | "TABS_MIGRATOR_WIDGET"
      > = entity.type;
      config = entityDefinitions[type];
      if (!config) {
        return null;
      }

      if (isFunction(config)) config = config(entity);

      entityProperties = Object.keys(config)
        .filter((k) => k.indexOf("!") === -1)
        .map((widgetProperty) => {
          return {
            propertyName: widgetProperty,
            entityName: entity.widgetName,
            value: entity[widgetProperty],
          };
        });
      break;
  }
  return (
    <EntityInfoContainer
      className={classNames({
        "absolute overflow-y-auto overflow-x-hidden bg-white pb-4 flex flex-col justify-center z-10 delay-150 transition-all": true,
        "-left-100": !show,
      })}
      ref={ref}
    >
      <div className="h-auto overflow-y-auto overflow-x-hidden relative">
        <div className="sticky top-0 text-sm px-3 bg-white z-5 pt-4 pb-1 font-medium flex flex-row items-center justify-between w-[100%]">
          BINDINGS
          <CloseIcon
            className="t--entity-property-close"
            color="black"
            height={18}
            onClick={closeContainer}
            width={18}
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
