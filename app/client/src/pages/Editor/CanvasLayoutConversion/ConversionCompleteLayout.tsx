import React from "react";

import { Colors } from "constants/Colors";
import { Icon, IconSize } from "design-system-old";
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
      <Icon
        className="pb-4"
        name={AlertIcons[props.alertType]}
        size={IconSize.XXXXL}
      />
      <h2 className="text-base font-medium py-1">{props.headerText}</h2>
      {props.errorText && (
        <p className="text-sm font-normal" style={{ color: Colors.ERROR_600 }}>
          {props.errorText}
        </p>
      )}
      <p className="text-sm font-normal" style={{ color: Colors.GRAY_500 }}>
        {props.infoText}
      </p>
    </div>
  );
};
