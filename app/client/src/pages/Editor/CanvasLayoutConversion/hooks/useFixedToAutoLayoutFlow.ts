import {
  BUILD_RESPONSIVE,
  BUILD_RESPONSIVE_TEXT,
  CANCEL_DIALOG,
  CONVERT,
  CONVERTING_APP,
  createMessage,
  CREATE_SNAPSHOT,
  SAVE_SNAPSHOT,
  SAVE_SNAPSHOT_TEXT,
} from "@appsmith/constants/messages";
import { ConversionProps } from "../ConversionForm";

import { Dispatch } from "redux";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { useCommonConversionFlows } from "./useCommonConversionFlows";

export const useFixedToAutoLayoutFlow = (
  dispatch: Dispatch<any>,
  onCancel: () => void,
): {
  [key: string]: ConversionProps;
} => {
  return {
    [CONVERSION_STATES.START]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      infoBlocks: [
        {
          icon: "devices",
          header: createMessage(BUILD_RESPONSIVE),
          info: createMessage(BUILD_RESPONSIVE_TEXT),
        },
        {
          icon: "history-line",
          header: createMessage(SAVE_SNAPSHOT),
          info: createMessage(SAVE_SNAPSHOT_TEXT),
        },
      ],
      primaryButton: {
        text: createMessage(CONVERT),
        onClick: () => {
          dispatch(
            setLayoutConversionStateAction(CONVERSION_STATES.SNAPSHOT_SPINNER),
          );
          dispatch({
            type: ReduxActionTypes.CONVERT_FIXED_TO_AUTO,
          });
        },
      },
    },
    [CONVERSION_STATES.SNAPSHOT_SPINNER]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      spinner: createMessage(CREATE_SNAPSHOT),
    },
    [CONVERSION_STATES.CONVERSION_SPINNER]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      spinner: createMessage(CONVERTING_APP),
    },
    ...useCommonConversionFlows(dispatch, onCancel),
  };
};
