import {
  BACK,
  CANCEL_DIALOG,
  createMessage,
  CREATE_SNAPSHOT,
  SNAPSHOT_LABEL,
  USE_SNAPSHOT,
  USE_SNAPSHOT_TEXT,
} from "ce/constants/messages";
import { ConversionProps } from "../ConversionForm";

import { Dispatch } from "redux";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { useCommonConversionFlows } from "./useCommonConversionFlows";
import {
  buildSnapshotTimeString,
  ReadableSnapShotDetails,
} from "selectors/autoLayoutSelectors";
import { Colors } from "constants/Colors";

export const useSnapShotFlow = (
  dispatch: Dispatch<any>,
  readableSnapShotDetails: ReadableSnapShotDetails | undefined,
  onCancel: () => void,
  backState?: CONVERSION_STATES,
): {
  [key: string]: ConversionProps;
} => {
  return {
    [CONVERSION_STATES.SNAPSHOT_START]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      bannerMessageDetails: {
        message: createMessage(USE_SNAPSHOT_TEXT),
        backgroundColor: Colors.GRAY_100,
        iconName: "question-line",
        iconColor: Colors.GRAY_600,
        textColor: Colors.GRAY_800,
      },
      snapShotDetails: {
        labelText: createMessage(SNAPSHOT_LABEL),
        icon: "history-line",
        text: buildSnapshotTimeString(readableSnapShotDetails),
      },
      primaryButton: {
        text: createMessage(USE_SNAPSHOT),
        onClick: () => {
          dispatch(
            setLayoutConversionStateAction(
              CONVERSION_STATES.RESTORING_SNAPSHOT_SPINNER,
            ),
          );
          dispatch({
            type: ReduxActionTypes.RESTORE_SNAPSHOT,
          });
        },
      },
      secondaryButton: backState
        ? {
            text: createMessage(BACK),
            onClick: () => {
              dispatch(setLayoutConversionStateAction(backState));
            },
          }
        : undefined,
    },
    [CONVERSION_STATES.RESTORING_SNAPSHOT_SPINNER]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      spinner: createMessage(CREATE_SNAPSHOT),
    },
    ...useCommonConversionFlows(dispatch, onCancel),
  };
};
