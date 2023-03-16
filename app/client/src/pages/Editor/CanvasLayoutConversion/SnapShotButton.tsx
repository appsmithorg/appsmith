import * as Sentry from "@sentry/react";

import React, { useCallback } from "react";

import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ConversionForm } from "./ConversionForm";
import {
  createMessage,
  USE_SNAPSHOT_CTA,
  USE_SNAPSHOT_HEADER,
} from "@appsmith/constants/messages";
import { Text, TextType } from "design-system-old";
import { useSnapShotForm } from "./hooks/useSnapShotForm";
import { setLayoutConversionStateAction } from "actions/autoLayoutActions";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { useDispatch } from "react-redux";

export function SnapShotButton() {
  const dispatch = useDispatch();

  const onOpenOrClose = useCallback((isOpen: boolean) => {
    if (isOpen) {
      dispatch(
        setLayoutConversionStateAction(CONVERSION_STATES.SNAPSHOT_START),
      );
    }
  }, []);

  return (
    <FormDialogComponent
      Form={ConversionForm(useSnapShotForm)}
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
      isCloseButtonShown={false}
      onOpenOrClose={onOpenOrClose}
      title={createMessage(USE_SNAPSHOT_HEADER)}
      trigger={
        <Text
          className="m-0 py-1 px-2 hover:bg-orange-200 cursor-pointer"
          type={TextType.H5}
          weight={600}
        >
          {createMessage(USE_SNAPSHOT_CTA)}
        </Text>
      }
    />
  );
}

SnapShotButton.displayName = "SnapShotButton";

export default Sentry.withProfiler(SnapShotButton);
