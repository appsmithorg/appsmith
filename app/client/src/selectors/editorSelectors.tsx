import { createSelector } from "reselect";
import createCachedSelector from "re-reselect";

import { AppState } from "../reducers";
import { EditorReduxState } from "../reducers/uiReducers/editorReducer";
import { WidgetConfigReducerState } from "../reducers/entityReducers/widgetConfigReducer";
import { WidgetCardProps } from "../widgets/BaseWidget";
import { WidgetSidebarReduxState } from "../reducers/uiReducers/widgetSidebarReducer";
import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer";

const getEditorState = (state: AppState) => state.ui.editor;
const getWidgetConfigs = (state: AppState) => state.entities.widgetConfig;
const getEntities = (state: AppState) => state.entities;
const getWidgetSideBar = (state: AppState) => state.ui.widgetSidebar;

export const getPropertyPaneConfigsId = createSelector(
  getEditorState,
  (editor: EditorReduxState) => editor.propertyPaneConfigsId,
);

export const getCurrentPageId = createSelector(
  getEditorState,
  (editor: EditorReduxState) => editor.currentPageId,
);

export const getCurrentLayoutId = createSelector(
  getEditorState,
  (editor: EditorReduxState) => editor.currentLayoutId,
);

export const getPageWidgetId = createSelector(
  getEditorState,
  (editor: EditorReduxState) => editor.pageWidgetId,
);

export const getCurrentPageName = createSelector(
  getEditorState,
  (editor: EditorReduxState) => editor.currentPageName,
);

export const getCurrentApplicationId = createSelector(
  getEditorState,
  (editor: EditorReduxState) => editor.currentApplicationId,
);

export const getIsPageSaving = createSelector(
  getEditorState,
  (editor: EditorReduxState) => editor.isSaving,
);

export const getWidgetCards = createSelector(
  getWidgetSideBar,
  getWidgetConfigs,
  (
    widgetCards: WidgetSidebarReduxState,
    widgetConfigs: WidgetConfigReducerState,
  ) => {
    const cards = widgetCards.cards;
    const groups: string[] = Object.keys(cards);
    groups.forEach((group: string) => {
      cards[group] = cards[group].map((widget: WidgetCardProps) => {
        const { rows, columns } = widgetConfigs.config[widget.type];
        return { ...widget, rows, columns };
      });
    });
    return cards;
  },
);

// TODO(abhinav) : Benchmark this, see how many times this is called in the application
// lifecycle. Move to using flattend redux state for widgets if necessary.

// Also, try to merge the widgetCards and widgetConfigs in the fetch Saga.
// No point in storing widgetCards, without widgetConfig
// Alternatively, try to see if we can continue to use only WidgetConfig and eliminate WidgetCards

export const getDenormalizedDSL = createCachedSelector(
  getPageWidgetId,
  getEntities,
  (pageWidgetId: string, entities: any) => {
    return CanvasWidgetsNormalizer.denormalize(pageWidgetId, entities);
  },
)((pageWidgetId, entities) => entities || 0);
