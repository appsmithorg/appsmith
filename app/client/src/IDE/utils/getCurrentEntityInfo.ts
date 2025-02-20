import { FocusEntity } from "navigation/FocusEntity";
import {
  EditorEntityTab,
  EditorEntityTabState,
} from "../Interfaces/EditorTypes";

/**
 * Resolve segment and segmentMode based on entity type.
 */
export function getCurrentEntityInfo(entity: FocusEntity) {
  switch (entity) {
    case FocusEntity.QUERY:
    case FocusEntity.API:
    case FocusEntity.QUERY_MODULE_INSTANCE:
      return {
        segment: EditorEntityTab.QUERIES,
        segmentMode: EditorEntityTabState.Edit,
      };
    case FocusEntity.QUERY_LIST:
      return {
        segment: EditorEntityTab.QUERIES,
        segmentMode: EditorEntityTabState.List,
      };
    case FocusEntity.QUERY_ADD:
      return {
        segment: EditorEntityTab.QUERIES,
        segmentMode: EditorEntityTabState.Add,
      };
    case FocusEntity.JS_OBJECT:
    case FocusEntity.JS_MODULE_INSTANCE:
      return {
        segment: EditorEntityTab.JS,
        segmentMode: EditorEntityTabState.Edit,
      };
    case FocusEntity.JS_OBJECT_ADD:
      return {
        segment: EditorEntityTab.JS,
        segmentMode: EditorEntityTabState.Add,
      };
    case FocusEntity.JS_OBJECT_LIST:
      return {
        segment: EditorEntityTab.JS,
        segmentMode: EditorEntityTabState.List,
      };
    case FocusEntity.CANVAS:
      return {
        segment: EditorEntityTab.UI,
        segmentMode: EditorEntityTabState.Add,
      };
    case FocusEntity.WIDGET:
      return {
        segment: EditorEntityTab.UI,
        segmentMode: EditorEntityTabState.Edit,
      };
    case FocusEntity.WIDGET_LIST:
      return {
        segment: EditorEntityTab.UI,
        segmentMode: EditorEntityTabState.List,
      };
    default:
      return {
        segment: EditorEntityTab.UI,
        segmentMode: EditorEntityTabState.Add,
      };
  }
}
