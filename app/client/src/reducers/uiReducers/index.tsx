import { combineReducers } from "redux";
import canvasReducer from "./canvasReducer";
import widgetCardsPaneReducer from "./widgetCardsPaneReducer";
import editorHeaderReducer from "./editorHeaderReducer";
import editorReducer from "./editorReducer";

const uiReducer = combineReducers({
  canvas: canvasReducer,
  widgetCardsPane: widgetCardsPaneReducer,
  editorHeader: editorHeaderReducer,
  editor: editorReducer,
});
export default uiReducer;
