import React, { useMemo, useCallback, ReactNode, memo } from "react";
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
import { EntityPropertyProps } from "../Entity/EntityProperty";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { isFunction, noop } from "lodash";
import WidgetContextMenu from "./WidgetContextMenu";
import { updateWidgetName } from "actions/propertyPaneActions";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import EntityProperties from "../Entity/EntityProperties";

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

export const getWidgetProperies = (
  widgetProps: any,
  step: number,
): Array<EntityPropertyProps> => {
  let config: any =
    entityDefinitions[
      widgetProps.type as Exclude<
        Partial<WidgetType>,
        "CANVAS_WIDGET" | "ICON_WIDGET" | "SKELETON_WIDGET"
      >
    ];

  if (isFunction(config)) config = config(widgetProps);

  return Object.keys(config)
    .filter(k => k.indexOf("!") === -1)
    .map(widgetProperty => {
      return {
        propertyName: widgetProperty,
        entityName: widgetProps.widgetName,
        value: widgetProps[widgetProperty],
        step,
      };
    });
};

export type WidgetEntityProps = {
  widgetProps: WidgetTree;
  step: number;
  pageId: string;
  children: ReactNode;
  parentModalId?: string;
  searchKeyword?: string;
  isDefaultExpanded?: boolean;
};

export const WidgetEntity = memo((props: WidgetEntityProps) => {
  const { pageId } = useParams<ExplorerURLParams>();

  const { navigateToWidget, isWidgetSelected } = useWidget(
    props.widgetProps.widgetId,
    props.widgetProps.type,
    props.pageId,
    props.parentModalId,
  );

  if (UNREGISTERED_WIDGETS.indexOf(props.widgetProps.type) > -1)
    return <React.Fragment />;

  let children: ReactNode = props.children;
  if (!props.children) {
    children = (
      <EntityProperties
        entityType={ENTITY_TYPE.WIDGET}
        entityName={props.widgetProps.widgetName}
        isCurrentPage={pageId === props.pageId}
        step={props.step + 1}
        entity={props.widgetProps}
      />
    );
  }

  const contextMenu = (
    <WidgetContextMenu
      widgetId={props.widgetProps.widgetId}
      parentId={props.widgetProps.parentId}
      className={EntityClassNames.CONTEXT_MENU}
    />
  );

  return (
    <Entity
      key={props.widgetProps.widgetId}
      className="widget"
      icon={getWidgetIcon(props.widgetProps.type)}
      name={props.widgetProps.widgetName}
      action={navigateToWidget}
      active={isWidgetSelected}
      entityId={props.widgetProps.widgetId}
      step={props.step}
      updateEntityName={props.pageId === pageId ? updateWidgetName : noop}
      searchKeyword={props.searchKeyword}
      isDefaultExpanded={
        (!!props.searchKeyword && !!props.widgetProps.children) ||
        !!props.isDefaultExpanded
      }
      contextMenu={props.pageId === pageId && contextMenu}
    >
      {children}
    </Entity>
  );
});

WidgetEntity.displayName = "WidgetEntity";

export default WidgetEntity;
