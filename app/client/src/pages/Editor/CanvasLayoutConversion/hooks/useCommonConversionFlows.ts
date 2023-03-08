import {
  CLOSE,
  CONVERSION_ERROR,
  CONVERSION_ERROR_HEADER,
  CONVERSION_ERROR_TEXT,
  CONVERSION_SUCCESS_HEADER,
  CONVERSION_SUCCESS_TEXT,
  createMessage,
  REFRESH_THE_APP,
  SEND_REPORT,
} from "@appsmith/constants/messages";
import { ConversionProps } from "../ConversionForm";

import { Dispatch } from "redux";
import {
  AlertType,
  CONVERSION_STATES,
} from "reducers/uiReducers/layoutConversionReducer";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const useCommonConversionFlows = (
  dispatch: Dispatch<any>,
  onCancel: () => void,
): {
  [key: string]: ConversionProps;
} => {
  return {
    [CONVERSION_STATES.COMPLETED_SUCCESS]: {
      conversionComplete: {
        alertType: AlertType.SUCCESS,
        headerText: createMessage(CONVERSION_SUCCESS_HEADER),
        infoText: createMessage(CONVERSION_SUCCESS_TEXT),
      },
      primaryButton: {
        text: createMessage(REFRESH_THE_APP),
        onClick: () => {
          onCancel();
          location.reload();
        },
      },
    },
    [CONVERSION_STATES.COMPLETED_ERROR]: {
      cancelButtonText: createMessage(CLOSE),
      conversionComplete: {
        alertType: AlertType.ERROR,
        headerText: createMessage(CONVERSION_ERROR_HEADER),
        infoText: createMessage(CONVERSION_ERROR_TEXT),
        errorText: createMessage(CONVERSION_ERROR),
      },
      primaryButton: {
        text: createMessage(SEND_REPORT),
        onClick: () => {
          onCancel();
          dispatch({
            type: ReduxActionTypes.LOG_LAYOUT_CONVERSION_ERROR,
          });
        },
      },
    },
  };
};
