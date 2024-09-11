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
} from "ee/constants/messages";
import type { ConversionProps } from "../ConversionForm";

import type { Dispatch } from "redux";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { commonConversionFlows } from "./CommonConversionFlows";

//returns props for Fixed to auto-layout conversion flows based on which the Conversion Form can be rendered
export const useFixedToAutoLayoutFlow = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: Dispatch<any>,
): {
  [key: string]: ConversionProps;
} => {
  return {
    [CONVERSION_STATES.START]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      infoBlocks: [
        {
          icon: "device",
          header: createMessage(BUILD_RESPONSIVE),
          info: createMessage(BUILD_RESPONSIVE_TEXT),
        },
        {
          icon: "history",
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
      spinner: createMessage(CREATE_SNAPSHOT),
    },
    [CONVERSION_STATES.CONVERSION_SPINNER]: {
      spinner: createMessage(CONVERTING_APP),
    },
    ...commonConversionFlows(dispatch),
  };
};
