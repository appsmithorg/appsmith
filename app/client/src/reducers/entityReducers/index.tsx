import { combineReducers } from "redux"
import canvasWidgetsReducer from "./canvasWidgetsReducer"
import apiDataReducer from './apiDataReducer';
import queryDataReducer from './queryDataReducer';
import widgetConfigReducer from './widgetConfigReducer.tsx';

const entityReducer = combineReducers({ canvasWidgets: canvasWidgetsReducer, apiData: apiDataReducer, queryData: queryDataReducer, widgetConfig: widgetConfigReducer })
export default entityReducer
