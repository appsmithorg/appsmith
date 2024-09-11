import {
  BACK,
  CANCEL_DIALOG,
  createMessage,
  DISCARD,
  DISCARD_SNAPSHOT_TEXT,
  RESTORING_SNAPSHOT,
  SNAPSHOT_LABEL,
  SNAPSHOT_TIME_FROM_MESSAGE,
  USE_SNAPSHOT,
  USE_SNAPSHOT_TEXT,
} from "ee/constants/messages";
import type { ConversionProps } from "../ConversionForm";

import type { Dispatch } from "redux";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import {
  setConversionStop,
  setLayoutConversionStateAction,
} from "actions/autoLayoutActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getSnapshotUpdatedTime } from "selectors/autoLayoutSelectors";
import { commonConversionFlows } from "./CommonConversionFlows";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import type { ReadableSnapShotDetails } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import { getReadableSnapShotDetails } from "layoutSystems/autolayout/utils/AutoLayoutUtils";

//returns props for using snapshot flows based on which the Conversion Form can be rendered
export const snapShotFlow = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: Dispatch<any>,
  readableSnapShotDetails: ReadableSnapShotDetails | undefined,
  backState?: CONVERSION_STATES,
): {
  [key: string]: ConversionProps;
} => {
  return {
    [CONVERSION_STATES.SNAPSHOT_START]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      bannerMessageDetails: {
        message: createMessage(USE_SNAPSHOT_TEXT),
        kind: "info",
      },
      snapShotDetails: readableSnapShotDetails && {
        labelText: createMessage(SNAPSHOT_LABEL),
        icon: "history",
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
    [CONVERSION_STATES.DISCARD_SNAPSHOT]: {
      snapShotDetails: readableSnapShotDetails && {
        labelText: createMessage(DISCARD_SNAPSHOT_TEXT),
        icon: "history",
        text: createMessage(
          SNAPSHOT_TIME_FROM_MESSAGE,
          readableSnapShotDetails.timeSince,
          readableSnapShotDetails.readableDate,
        ),
      },
      cancelButtonText: createMessage(CANCEL_DIALOG),
      primaryButton: {
        text: createMessage(DISCARD),
        closeModal: true,
        onClick: () => {
          dispatch(setConversionStop());
          dispatch({
            type: ReduxActionTypes.DELETE_SNAPSHOT,
          });
        },
      },
    },
    [CONVERSION_STATES.RESTORING_SNAPSHOT_SPINNER]: {
      spinner: createMessage(RESTORING_SNAPSHOT),
    },
    ...commonConversionFlows(dispatch),
  };
};

export const useSnapShotForm = () => {
  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );
  const lastUpdatedTime = useSelector(getSnapshotUpdatedTime);
  const readableSnapShotDetails = getReadableSnapShotDetails(lastUpdatedTime);

  const dispatch = useDispatch();

  const snapshotFlowStates = snapShotFlow(dispatch, readableSnapShotDetails);

  return snapshotFlowStates[conversionState] || {};
};
