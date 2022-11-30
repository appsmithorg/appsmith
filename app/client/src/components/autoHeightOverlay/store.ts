import { GridDefaults } from "constants/WidgetConstants";

interface AutoHeightLimitsUIState {
  isMaxDotDragging: boolean;
  isMinDotDragging: boolean;
  maxY: number; // the actual value
  maxdY: number; // the difference during dragging
  minY: number; // the actual value
  mindY: number; // the difference during dragging
}

type SET_MAX_Y = { type: "SET_MAX_Y"; payload: { maxY: number } };
type SET_MIN_Y = { type: "SET_MIN_Y"; payload: { minY: number } };
type SET_MAX_D_Y = { type: "SET_MAX_D_Y"; payload: { maxdY: number } };
type SET_MIN_D_Y = { type: "SET_MIN_D_Y"; payload: { mindY: number } };
type SET_IS_MIN_DOT_DRAGGING = {
  type: "SET_IS_MIN_DOT_DRAGGING";
  payload: { isMinDotDragging: boolean };
};

type SET_IS_MAX_DOT_DRAGGING = {
  type: "SET_IS_MAX_DOT_DRAGGING";
  payload: { isMaxDotDragging: boolean };
};

type AutoHeightLimitsUIAction =
  | SET_MAX_Y
  | SET_MIN_Y
  | SET_MAX_D_Y
  | SET_MIN_D_Y
  | SET_IS_MIN_DOT_DRAGGING
  | SET_IS_MAX_DOT_DRAGGING;

export function AutoHeightOverlayUIStateReducer(
  state: AutoHeightLimitsUIState,
  action: AutoHeightLimitsUIAction,
) {
  if (action.type === "SET_IS_MAX_DOT_DRAGGING") {
    return {
      ...state,
      isMaxDotDragging: action.payload.isMaxDotDragging,
    };
  }

  if (action.type === "SET_IS_MIN_DOT_DRAGGING") {
    return {
      ...state,
      isMinDotDragging: action.payload.isMinDotDragging,
    };
  }

  if (action.type === "SET_MAX_Y") {
    return {
      ...state,
      maxY: action.payload.maxY,
    };
  }

  if (action.type === "SET_MIN_Y") {
    return {
      ...state,
      minY: action.payload.minY,
    };
  }

  if (action.type === "SET_MAX_D_Y") {
    return {
      ...state,
      maxdY: action.payload.maxdY,
    };
  }

  if (action.type === "SET_MIN_D_Y") {
    return {
      ...state,
      mindY: action.payload.mindY,
    };
  }

  return state;
}

interface CreateInitialAutoHeightUIStateProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

export function createInitialAutoHeightUIState({
  maxDynamicHeight,
  minDynamicHeight,
}: CreateInitialAutoHeightUIStateProps) {
  return {
    isMinDotDragging: false,
    isMaxDotDragging: false,
    maxY: maxDynamicHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT, // the actual value
    maxdY: 0, // the difference during dragging
    minY: minDynamicHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT, // the actual value
    mindY: 0, // the difference during dragging
  };
}
