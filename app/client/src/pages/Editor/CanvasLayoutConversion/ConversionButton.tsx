import * as Sentry from "@sentry/react";

import React, { useCallback } from "react";

import { Button, Category, Size, Text, TextType } from "design-system-old";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ConversionForm } from "./ConversionForm";
import { useConversionForm } from "./hooks/useConversionForm";
import { useDispatch, useSelector } from "react-redux";
import { getIsAutoLayout } from "selectors/canvasSelectors";
import {
  CONVERT_TO_AUTO_BUTTON,
  CONVERT_TO_AUTO_TITLE,
  CONVERT_TO_FIXED_BUTTON,
  CONVERT_TO_FIXED_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import BetaCard from "components/editorComponents/BetaCard";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export function ConversionButton() {
  const isAutoLayout = useSelector(getIsAutoLayout);
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
      dispatch({
        type: ReduxActionTypes.START_CONVERSION_FLOW,
      });
    } else {
      dispatch({
        type: ReduxActionTypes.STOP_CONVERSION_FLOW,
      });
    }
  }, []);

  const header = () => {
    return (
      <div className="flex items-center gap-4">
        <Text type={TextType.H1}>{createMessage(titleText)}</Text>,
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

export default Sentry.withProfiler(ConversionButton);
