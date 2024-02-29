import type { AppState } from "@appsmith/reducers";
import { RenderModes } from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";

export const getRenderMode = (state: AppState) => {
  return state.entities.app.mode === APP_MODE.EDIT
    ? RenderModes.CANVAS
    : RenderModes.PAGE;
};
