import * as Sentry from "@sentry/react";

import React from "react";

import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ConversionForm } from "./ConversionForm";
import {
  createMessage,
  DISCARD_SNAPSHOT_CTA,
  DISCARD_SNAPSHOT_HEADER,
  USE_SNAPSHOT_CTA,
  USE_SNAPSHOT_HEADER,
} from "@appsmith/constants/messages";
import { Text, TextType } from "design-system-old";
import { useSnapShotForm } from "./hooks/useSnapShotForm";
import {
  setConversionStart,
  setConversionStop,
} from "actions/autoLayoutActions";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { useDispatch } from "react-redux";

export function SnapShotBannerCTA() {
  const dispatch = useDispatch();

  const handleOnOpenOrClose = (
    isOpen: boolean,
    conversionState: CONVERSION_STATES,
  ) => {
    if (isOpen) {
      dispatch(setConversionStart(conversionState));
    } else {
      dispatch(setConversionStop());
    }
  };

  return (
    <>
      <FormDialogComponent
        Form={ConversionForm(useSnapShotForm)}
        canEscapeKeyClose={false}
        canOutsideClickClose={false}
        isCloseButtonShown={false}
        onOpenOrClose={(isOpen: boolean) =>
          handleOnOpenOrClose(isOpen, CONVERSION_STATES.SNAPSHOT_START)
        }
        title={createMessage(USE_SNAPSHOT_HEADER)}
        trigger={
          <Text className="cursor-pointer pr-2" type={TextType.H5} weight={600}>
            {createMessage(USE_SNAPSHOT_CTA)}
          </Text>
        }
      />
      <FormDialogComponent
        Form={ConversionForm(useSnapShotForm)}
        canOutsideClickClose
        isCloseButtonShown={false}
        onOpenOrClose={(isOpen: boolean) =>
          handleOnOpenOrClose(isOpen, CONVERSION_STATES.DISCARD_SNAPSHOT)
        }
        title={createMessage(DISCARD_SNAPSHOT_HEADER)}
        trigger={
          <Text className="cursor-pointer pl-2" type={TextType.H5} weight={600}>
            {createMessage(DISCARD_SNAPSHOT_CTA)}
          </Text>
        }
      />
    </>
  );
}

SnapShotBannerCTA.displayName = "SnapShotBannerCTA";

export default Sentry.withProfiler(SnapShotBannerCTA);
