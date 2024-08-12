import {
  BUILD_FIXED_LAYOUT,
  BUILD_FIXED_LAYOUT_TEXT,
  CANCEL_DIALOG,
  CONVERSION_WARNING,
  CONVERT,
  CONVERTING_APP,
  CONVERT_ANYWAYS,
  createMessage,
  CREATE_SNAPSHOT,
  DROPDOWN_LABEL_TEXT,
  SAVE_SNAPSHOT,
  SAVE_SNAPSHOT_TEXT,
  SNAPSHOT_LABEL,
  SNAPSHOT_TIME_FROM_MESSAGE,
  SNAPSHOT_WARNING_MESSAGE,
  USE_SNAPSHOT,
} from "ee/constants/messages";
import type { ConversionProps } from "../ConversionForm";

import type { Dispatch } from "redux";
import { useState } from "react";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { useSelector } from "react-redux";
import { getSnapshotUpdatedTime } from "selectors/autoLayoutSelectors";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { snapShotFlow } from "./useSnapShotForm";
import { commonConversionFlows } from "./CommonConversionFlows";
import { getReadableSnapShotDetails } from "layoutSystems/autolayout/utils/AutoLayoutUtils";

//returns props for Auto to fixed layout conversion flows based on which the Conversion Form can be rendered
export const useAutoToFixedLayoutFlow = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: Dispatch<any>,
): {
  [key: string]: ConversionProps;
} => {
  const [selectedLayout, setSelectedLayout] = useState<string>("DESKTOP");

  const lastUpdatedTime = useSelector(getSnapshotUpdatedTime);
  const readableSnapShotDetails = getReadableSnapShotDetails(lastUpdatedTime);

  return {
    [CONVERSION_STATES.START]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      infoBlocks: [
        {
          icon: "grid",
          header: createMessage(BUILD_FIXED_LAYOUT),
          info: createMessage(BUILD_FIXED_LAYOUT_TEXT),
        },
        {
          icon: "history",
          header: createMessage(SAVE_SNAPSHOT),
          info: createMessage(SAVE_SNAPSHOT_TEXT),
        },
      ],
      selectDropDown: {
        options: [
          {
            label: "Desktop",
            value: "DESKTOP",
            startIcon: "desktop",
          },
          {
            label: "Mobile device",
            value: "MOBILE",
            startIcon: "mobile",
          },
        ],
        selected: selectedLayout,
        onSelect: (value: string) => {
          setSelectedLayout(value);
        },
        labelText: createMessage(DROPDOWN_LABEL_TEXT),
      },
      primaryButton: {
        text: createMessage(CONVERT),
        onClick: () => {
          if (readableSnapShotDetails) {
            dispatch(
              setLayoutConversionStateAction(
                CONVERSION_STATES.CONFIRM_CONVERSION,
              ),
            );
          } else {
            dispatch(
              setLayoutConversionStateAction(
                CONVERSION_STATES.SNAPSHOT_SPINNER,
              ),
            );
            dispatch({
              type: ReduxActionTypes.CONVERT_AUTO_TO_FIXED,
              payload: selectedLayout,
            });
          }
        },
      },
    },
    [CONVERSION_STATES.CONFIRM_CONVERSION]: {
      cancelButtonText: createMessage(CANCEL_DIALOG),
      bannerMessageDetails: {
        message: createMessage(CONVERSION_WARNING),
        kind: "warning",
      },
      snapShotDetails: readableSnapShotDetails && {
        labelText: createMessage(SNAPSHOT_LABEL),
        icon: "history",
        text: createMessage(
          SNAPSHOT_TIME_FROM_MESSAGE,
          readableSnapShotDetails.timeSince,
          readableSnapShotDetails.readableDate,
        ),
        postText: createMessage(SNAPSHOT_WARNING_MESSAGE),
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
      secondaryButton: {
        text: createMessage(CONVERT_ANYWAYS),
        onClick: () => {
          dispatch(
            setLayoutConversionStateAction(CONVERSION_STATES.SNAPSHOT_SPINNER),
          );
          dispatch({
            type: ReduxActionTypes.CONVERT_AUTO_TO_FIXED,
            payload: selectedLayout,
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
    ...snapShotFlow(dispatch, readableSnapShotDetails),
  };
};
