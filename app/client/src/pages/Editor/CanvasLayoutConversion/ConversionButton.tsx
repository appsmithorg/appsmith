import * as Sentry from "@sentry/react";

import React, { useCallback } from "react";

import { Button, Category, Size, Text, TextType } from "design-system-old";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ConversionForm } from "./ConversionForm";
import { useConversionForm } from "./hooks/useConversionForm";
import { useDispatch } from "react-redux";
import { getIsAutoLayout } from "selectors/canvasSelectors";
import {
  CONVERT_TO_AUTO_BUTTON,
  CONVERT_TO_AUTO_TITLE,
  CONVERT_TO_FIXED_BUTTON,
  CONVERT_TO_FIXED_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import BetaCard from "components/editorComponents/BetaCard";
import store from "store";
import {
  setConversionStart,
  setConversionStop,
} from "actions/autoLayoutActions";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";

function ConversionButton() {
  const isAutoLayout = getIsAutoLayout(store.getState());
  const dispatch = useDispatch();

  //Text base on if it is an Auto layout
  const titleText = isAutoLayout
    ? CONVERT_TO_FIXED_TITLE
    : CONVERT_TO_AUTO_TITLE;
  const buttonText = isAutoLayout
    ? CONVERT_TO_FIXED_BUTTON
    : CONVERT_TO_AUTO_BUTTON;

  const onOpenOrClose = useCallback((isOpen: boolean) => {
    if (isOpen) {
      dispatch(setConversionStart(CONVERSION_STATES.START));
    } else {
      dispatch(setConversionStop());
    }
  }, []);

  const header = () => {
    return (
      <div className="flex items-center gap-3">
        <Text type={TextType.H1}>{createMessage(titleText)}</Text>
        <BetaCard />
      </div>
    );
  };

  return (
    <FormDialogComponent
      Form={ConversionForm<{ isAutoLayout: boolean }>(useConversionForm, {
        isAutoLayout,
      })}
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
      getHeader={header}
      isCloseButtonShown={false}
      onOpenOrClose={onOpenOrClose}
      trigger={
        <Button
          category={Category.secondary}
          className="mb-6"
          fill
          id="t--layout-conversion-cta"
          size={Size.medium}
          text={createMessage(buttonText)}
        />
      }
    />
  );
}

ConversionButton.displayName = "ConversionButton";

export default React.memo(Sentry.withProfiler(ConversionButton));
