import { combineReducers } from "redux";
import canvasReducer from "./canvasReducer";
import widgetCardsPaneReducer from "./widgetCardsPaneReducer";
import editorHeaderReducer from "./editorHeaderReducer";
import editorReducer from "./editorReducer";
import propertyPaneReducer from "./propertyPaneReducer";

const uiReducer = combineReducers({
  canvas: canvasReducer,
  widgetCardsPane: widgetCardsPaneReducer,
  editorHeader: editorHeaderReducer,
  editor: editorReducer,
  propertyPane: propertyPaneReducer,
});
export default uiReducer;
