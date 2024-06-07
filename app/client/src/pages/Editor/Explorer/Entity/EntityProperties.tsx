import React, { useCallback, useEffect } from "react";
import EntityProperty from "./EntityProperty";

import { useDispatch, useSelector } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import type { AppState } from "@appsmith/reducers";
import classNames from "classnames";
import styled from "styled-components";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { EntityClassNames } from ".";
import { Button } from "design-system";
import { getEntityProperties } from "@appsmith/pages/Editor/Explorer/Entity/getEntityProperties";
import store from "store";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

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

export function EntityProperties() {
  const ref = React.createRef<HTMLDivElement>();
  const dispatch = useDispatch();
  const { entityId, entityName, entityType, show } =
    useSelector(selectEntityInfo);
  const entity = useSelector(
    (state) => entityName && state.evaluations.tree[entityName],
  );

  const selectedWidgetId = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );

  PerformanceTracker.startTracking(
    PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
  );
  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
    );
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

  useEffect(() => {
    if (selectedWidgetId && show) {
      const canvasWidgets = store.getState().entities.canvasWidgets;
      const selectedWidget = canvasWidgets[selectedWidgetId];
      if (selectedWidget)
        dispatch({
          type: ReduxActionTypes.SET_ENTITY_INFO,
          payload: {
            show: true,
            entityId: selectedWidgetId,
            entityType: ENTITY_TYPE.WIDGET,
            entityName: selectedWidget.widgetName,
          },
        });
      else
        dispatch({
          type: ReduxActionTypes.SET_ENTITY_INFO,
          payload: { show: false },
        });
    }
  }, [selectedWidgetId]);

  const closeContainer = useCallback((e) => {
    e.stopPropagation();
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: { show: false },
    });
  }, []);

  const handleOutsideClick = (e: MouseEvent) => {
    e.stopPropagation();
    const entityPropertiesContainer = document.getElementById(
      "entity-properties-container",
    ) as HTMLElement;
    const paths = e.composedPath();
    if (!paths?.includes(entityPropertiesContainer)) closeContainer(e);
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
      ref.current.style.left = "100%";
    }
  }, [entityId]);

  if (!entity || !entityName || !entityType) return null;

  const entityProperties = getEntityProperties({
    entity,
    entityName,
    entityType,
  });

  return (
    <EntityInfoContainer
      className={classNames({
        "absolute bp3-popover overflow-y-auto overflow-x-hidden bg-white pb-2 flex flex-col justify-center z-10 delay-150 transition-all":
          true,
        [EntityClassNames.CONTEXT_MENU_CONTENT]: true,
        "-left-100": !show,
      })}
      id="entity-properties-container"
      ref={ref}
    >
      <div className="h-auto overflow-y-auto overflow-x-hidden relative">
        <div className="sticky top-0 text-sm px-3 z-5 pt-2 pb-1 font-medium flex flex-row items-center justify-between w-[100%] bg-white">
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
        {entityProperties.map((entityProperty, index) => (
          <EntityProperty
            key={entityProperty.propertyName}
            {...entityProperty}
            index={index}
          />
        ))}
      </div>
    </EntityInfoContainer>
  );
}

export default Sentry.withProfiler(EntityProperties);
