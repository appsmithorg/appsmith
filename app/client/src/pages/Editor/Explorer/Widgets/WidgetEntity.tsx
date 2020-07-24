import React, { useMemo, useCallback, ReactNode } from "react";
import Entity, { EntityClassNames } from "../Entity";
import { WidgetProps } from "widgets/BaseWidget";
import { WidgetTypes, WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { flashElement } from "utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import {
  forceOpenPropertyPane,
  showModal,
  closeAllModals,
} from "actions/widgetActions";
import { useWidgetSelection } from "utils/hooks/dragResizeHooks";
import { AppState } from "reducers";
import { getWidgetIcon } from "../ExplorerIcons";
import EntityProperty, { EntityPropertyProps } from "../Entity/EntityProperty";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { isFunction } from "lodash";
import WidgetContextMenu from "./WidgetContextMenu";
import { updateWidgetName } from "actions/propertyPaneActions";

export type WidgetTree = WidgetProps & { children?: WidgetTree[] };

const UNREGISTERED_WIDGETS: WidgetType[] = [WidgetTypes.ICON_WIDGET];

const navigateToCanvas = (params: ExplorerURLParams, currentPath: string) => {
  const canvasEditorURL = `${BUILDER_PAGE_URL(
    params.applicationId,
    params.pageId,
  )}`;
  if (currentPath !== canvasEditorURL) {
    history.push(canvasEditorURL);
  }
};

const flashElementById = (id: string) => {
  const el = document.getElementById(id);
  el?.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  if (el) flashElement(el);
};

const useWidget = (
  widgetId: string,
  widgetType: WidgetType,
  parentModalId?: string,
) => {
  const params = useParams<ExplorerURLParams>();
  const dispatch = useDispatch();
  const { selectWidget } = useWidgetSelection();

  const navigateToWidget = useCallback(() => {
    if (widgetType === WidgetTypes.MODAL_WIDGET) {
      dispatch(showModal(widgetId));
      return;
    }
    if (parentModalId) dispatch(showModal(parentModalId));
    else dispatch(closeAllModals());
    navigateToCanvas(params, window.location.pathname);
    flashElementById(widgetId);
    selectWidget(widgetId);
    dispatch(forceOpenPropertyPane(widgetId));
  }, [dispatch, params, selectWidget, widgetType, widgetId, parentModalId]);

  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidget,
  );

  const isWidgetSelected = useMemo(() => selectedWidget === widgetId, [
    selectedWidget,
    widgetId,
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
        "CANVAS_WIDGET" | "ICON_WIDGET"
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
  children: ReactNode;
  parentModalId?: string;
  searchKeyword?: string;
};

export const WidgetEntity = (props: WidgetEntityProps) => {
  const { navigateToWidget, isWidgetSelected } = useWidget(
    props.widgetProps.widgetId,
    props.widgetProps.type,
    props.parentModalId,
  );

  if (UNREGISTERED_WIDGETS.indexOf(props.widgetProps.type) > -1)
    return <React.Fragment />;

  let children: ReactNode = props.children;
  if (!props.children) {
    children = getWidgetProperies(
      props.widgetProps,
      props.step + 1,
    ).map((widgetProperty: EntityPropertyProps) => (
      <EntityProperty {...widgetProperty} key={widgetProperty.propertyName} />
    ));
  }

  return (
    <Entity
      key={props.widgetProps.widgetId}
      icon={getWidgetIcon(props.widgetProps.type)}
      name={props.widgetProps.widgetName}
      action={navigateToWidget}
      active={isWidgetSelected}
      entityId={props.widgetProps.widgetId}
      step={props.step}
      updateEntityName={updateWidgetName}
      searchKeyword={props.searchKeyword}
      isDefaultExpanded={!!props.searchKeyword && !!props.widgetProps.children}
      contextMenu={
        <WidgetContextMenu
          widgetId={props.widgetProps.widgetId}
          parentId={props.widgetProps.parentId}
          className={EntityClassNames.ACTION_CONTEXT_MENU}
        />
      }
    >
      {children}
    </Entity>
  );
};

export default WidgetEntity;
