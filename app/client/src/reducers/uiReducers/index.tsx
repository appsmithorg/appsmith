import { combineReducers } from "redux";
import widgetCardsPaneReducer from "./widgetCardsPaneReducer";
import editorHeaderReducer from "./editorHeaderReducer";
import editorReducer from "./editorReducer";

const uiReducer = combineReducers({
  widgetCardsPane: widgetCardsPaneReducer,
  editorHeader: editorHeaderReducer,
  editor: editorReducer,
});
export default uiReducer;
