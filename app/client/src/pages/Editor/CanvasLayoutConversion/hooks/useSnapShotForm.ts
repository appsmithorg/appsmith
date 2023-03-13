import {
  BACK,
  CANCEL_DIALOG,
  createMessage,
  RESTORING_SNAPSHOT,
  SNAPSHOT_LABEL,
  SNAPSHOT_TIME_FROM_MESSAGE,
  USE_SNAPSHOT,
  USE_SNAPSHOT_TEXT,
} from "ce/constants/messages";
import { ConversionProps } from "../ConversionForm";

import { Dispatch } from "redux";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getReadableSnapShotDetails,
  ReadableSnapShotDetails,
} from "selectors/autoLayoutSelectors";
import { Colors } from "constants/Colors";
import { commonConversionFlows } from "./CommonConversionFlows";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { useEffect } from "react";

//returns props for using snapshot flows based on which the Conversion Form can be rendered
export const snapShotFlow = (
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
      snapShotDetails: readableSnapShotDetails && {
        labelText: createMessage(SNAPSHOT_LABEL),
        icon: "history-line",
        text: createMessage(
          SNAPSHOT_TIME_FROM_MESSAGE,
          readableSnapShotDetails.timeSince,
          readableSnapShotDetails.readableDate,
        ),
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
      spinner: createMessage(RESTORING_SNAPSHOT),
    },
    ...commonConversionFlows(dispatch, onCancel),
  };
};

export const useSnapShotForm = (onCancel: () => void) => {
  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );
  const readableSnapShotDetails = useSelector(getReadableSnapShotDetails);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLayoutConversionStateAction(CONVERSION_STATES.SNAPSHOT_START));
  }, []);

  const snapshotFlowStates = snapShotFlow(
    dispatch,
    readableSnapShotDetails,
    onCancel,
  );

  return snapshotFlowStates[conversionState] || {};
};
