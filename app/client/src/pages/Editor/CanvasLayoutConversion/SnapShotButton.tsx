import * as Sentry from "@sentry/react";

import React, { useEffect } from "react";

import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ConversionForm } from "./ConversionForm";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { useSnapShotFlow } from "./hooks/useSnapShotFlow";
import { getReadableSnapShotDetails } from "selectors/autoLayoutSelectors";
import {
  createMessage,
  USE_SNAPSHOT_CTA,
  USE_SNAPSHOT_HEADER,
} from "@appsmith/constants/messages";
import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";

const useSnapShotForm = (onCancel: () => void) => {
  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );
  const readableSnapShotDetails = useSelector(getReadableSnapShotDetails);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLayoutConversionStateAction(CONVERSION_STATES.SNAPSHOT_START));
  }, []);

  const snapshotFlowStates = useSnapShotFlow(
    dispatch,
    readableSnapShotDetails,
    onCancel,
  );

  return snapshotFlowStates[conversionState] || {};
};

export function SnapShotButton() {
  return (
    <FormDialogComponent
      Form={ConversionForm(useSnapShotForm)}
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
      isCloseButtonShown={false}
      title={createMessage(USE_SNAPSHOT_HEADER)}
      trigger={
        <p className="font-semibold text-xs m-0 py-1 px-2 hover:bg-orange-200 cursor-pointer">
          {createMessage(USE_SNAPSHOT_CTA)}
        </p>
      }
    />
  );
}

SnapShotButton.displayName = "SnapShotButton";

export default Sentry.withProfiler(SnapShotButton);
