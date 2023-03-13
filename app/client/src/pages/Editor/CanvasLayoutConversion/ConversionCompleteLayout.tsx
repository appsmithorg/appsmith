import React from "react";

import { Colors } from "constants/Colors";
import { Icon, IconSize, Text, TextType } from "design-system-old";
import { AlertType } from "reducers/uiReducers/layoutConversionReducer";

const AlertIcons = {
  [AlertType.SUCCESS]: "success-line",
  [AlertType.WARNING]: "warning-line",
  [AlertType.ERROR]: "error-line",
};

export type ConversionCompleteLayoutProps = {
  alertType: AlertType;
  headerText: string;
  infoText: string;
  errorText?: string;
};

export const ConversionCompleteLayout = (
  props: ConversionCompleteLayoutProps,
) => {
  return (
    <div className="flex flex-col items-center pt-3">
      <Icon name={AlertIcons[props.alertType]} size={IconSize.XXXXL} />
      <Text className="py-1" type={TextType.H4}>
        {props.headerText}
      </Text>
      {props.errorText && (
        <Text color={Colors.ERROR_600} type={TextType.P1}>
          {props.errorText}
        </Text>
      )}
      <Text color={Colors.GRAY_500} type={TextType.P1}>
        {props.infoText}
      </Text>
    </div>
  );
};
