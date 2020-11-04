import React, { useMemo, useCallback, memo } from "react";
import Entity, { EntityClassNames } from "../Entity";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetTypes, WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { flashElementById } from "utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import {
  forceOpenPropertyPane,
  showModal,
  closeAllModals,
} from "actions/widgetActions";
import { useWidgetSelection } from "utils/hooks/dragResizeHooks";
import { AppState } from "reducers";
import { getWidgetIcon } from "../ExplorerIcons";

import { noop } from "lodash";
import WidgetContextMenu from "./WidgetContextMenu";
import { updateWidgetName } from "actions/propertyPaneActions";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import EntityProperties from "../Entity/EntityProperties";
import { CanvasStructure } from "reducers/uiReducers/pageCanvasStructure";
import CurrentPageEntityProperties from "../Entity/CurrentPageEntityProperties";

export type WidgetTree = WidgetProps & { children?: WidgetTree[] };

const UNREGISTERED_WIDGETS: WidgetType[] = [WidgetTypes.ICON_WIDGET];

export const navigateToCanvas = (
  params: ExplorerURLParams,
  currentPath: string,
  widgetPageId: string,
  widgetId: string,
) => {
  const canvasEditorURL = `${BUILDER_PAGE_URL(
    params.applicationId,
    widgetPageId,
  )}`;
  if (currentPath !== canvasEditorURL) {
    history.push(`${canvasEditorURL}#${widgetId}`);
  }
};

const useWidget = (
  widgetId: string,
  widgetType: WidgetType,
  pageId: string,
  parentModalId?: string,
) => {
  const params = useParams<ExplorerURLParams>();
  const dispatch = useDispatch();
  const { selectWidget } = useWidgetSelection();
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidget,
  );
  const isWidgetSelected = useMemo(() => selectedWidget === widgetId, [
    selectedWidget,
    widgetId,
  ]);

  const navigateToWidget = useCallback(() => {
    if (widgetType === WidgetTypes.MODAL_WIDGET) {
      dispatch(showModal(widgetId));
      return;
    }
    if (parentModalId) dispatch(showModal(parentModalId));
    else dispatch(closeAllModals());
    navigateToCanvas(params, window.location.pathname, pageId, widgetId);
    flashElementById(widgetId);
    if (!isWidgetSelected) selectWidget(widgetId);
    dispatch(forceOpenPropertyPane(widgetId));
  }, [
    dispatch,
    params,
    selectWidget,
    widgetType,
    widgetId,
    parentModalId,
    pageId,
    isWidgetSelected,
  ]);

  return { navigateToWidget, isWidgetSelected };
};

export type WidgetEntityProps = {
  widgetId: string;
  widgetName: string;
  widgetType: WidgetType;
  step: number;
  pageId: string;
  childWidgets?: CanvasStructure[];
  parentModalId?: string;
  searchKeyword?: string;
  isDefaultExpanded?: boolean;
};

export const WidgetEntity = memo((props: WidgetEntityProps) => {
  const { pageId } = useParams<ExplorerURLParams>();
  const widgetsToExpand = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgetAncestory,
  );
  let shouldExpand = false;
  if (widgetsToExpand.includes(props.widgetId)) shouldExpand = true;
  const { navigateToWidget, isWidgetSelected } = useWidget(
    props.widgetId,
    props.widgetType,
    props.pageId,
    props.parentModalId,
  );

  if (UNREGISTERED_WIDGETS.indexOf(props.widgetType) > -1)
    return <React.Fragment />;

  const contextMenu = (
    <WidgetContextMenu
      widgetId={props.widgetId}
      pageId={props.pageId}
      className={EntityClassNames.CONTEXT_MENU}
    />
  );

  return (
    <Entity
      key={props.widgetId}
      className="widget"
      active={isWidgetSelected}
      action={navigateToWidget}
      icon={getWidgetIcon(props.widgetType)}
      name={props.widgetName}
      entityId={props.widgetId}
      step={props.step}
      updateEntityName={props.pageId === pageId ? updateWidgetName : noop}
      searchKeyword={props.searchKeyword}
      isDefaultExpanded={
        shouldExpand ||
        (!!props.searchKeyword && !!props.childWidgets) ||
        !!props.isDefaultExpanded
      }
      contextMenu={props.pageId === pageId && contextMenu}
    >
      {props.childWidgets &&
        props.childWidgets.length > 0 &&
        props.childWidgets.map(child => (
          <WidgetEntity
            step={props.step + 1}
            widgetId={child.widgetId}
            widgetName={child.widgetName}
            widgetType={child.type}
            childWidgets={child.children}
            key={child.widgetId}
            searchKeyword={props.searchKeyword}
            pageId={props.pageId}
          />
        ))}
      {!(props.childWidgets && props.childWidgets.length > 0) &&
        pageId === props.pageId && (
          <CurrentPageEntityProperties
            key={props.widgetId}
            entityType={ENTITY_TYPE.WIDGET}
            entityName={props.widgetName}
            step={props.step + 1}
          />
        )}
      {!(props.childWidgets && props.childWidgets.length > 0) &&
        pageId !== props.pageId && (
          <EntityProperties
            key={props.widgetId}
            entityType={ENTITY_TYPE.WIDGET}
            entityName={props.widgetName}
            step={props.step + 1}
            pageId={props.pageId}
            entityId={props.widgetId}
          />
        )}
    </Entity>
  );
});

WidgetEntity.displayName = "WidgetEntity";

(WidgetEntity as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default WidgetEntity;
