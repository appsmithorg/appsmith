import { combineReducers } from "redux";
import widgetCardsPaneReducer from "./widgetCardsPaneReducer";
import editorHeaderReducer from "./editorHeaderReducer";
import editorReducer from "./editorReducer";
import propertyPaneReducer from "./propertyPaneReducer";

const uiReducer = combineReducers({
  widgetCardsPane: widgetCardsPaneReducer,
  editorHeader: editorHeaderReducer,
  editor: editorReducer,
  propertyPane: propertyPaneReducer,
});
export default uiReducer;
