import {
  CLOSE,
  CONVERSION_ERROR,
  CONVERSION_ERROR_HEADER,
  CONVERSION_ERROR_MESSAGE_HEADER,
  CONVERSION_ERROR_MESSAGE_TEXT_ONE,
  CONVERSION_ERROR_MESSAGE_TEXT_TWO,
  CONVERSION_ERROR_TEXT,
  CONVERSION_SUCCESS_HEADER,
  CONVERSION_SUCCESS_TEXT,
  createMessage,
  MORE_DETAILS,
  REFRESH_THE_APP,
  SEND_REPORT,
} from "@appsmith/constants/messages";
import type { ConversionProps } from "../ConversionForm";

import type { Dispatch } from "redux";
import {
  AlertType,
  CONVERSION_STATES,
} from "reducers/uiReducers/layoutConversionReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

//returns props for common conversion flows based on which the Conversion Form can be rendered
export const commonConversionFlows = (
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
          dispatch({ type: ReduxActionTypes.REFRESH_THE_APP });
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
      collapsibleMessage: {
        title: createMessage(MORE_DETAILS),
        messageHeader: createMessage(CONVERSION_ERROR_MESSAGE_HEADER),
        messagePoints: [
          createMessage(CONVERSION_ERROR_MESSAGE_TEXT_ONE),
          createMessage(CONVERSION_ERROR_MESSAGE_TEXT_TWO),
        ],
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
