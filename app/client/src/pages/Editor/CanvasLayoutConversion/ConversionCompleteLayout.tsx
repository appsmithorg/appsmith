import React from "react";

import { Colors } from "constants/Colors";
import { Icon, Text, TextType } from "design-system-old";
import { AlertType } from "reducers/uiReducers/layoutConversionReducer";
import styled from "styled-components";

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

const StyledHugeIcon = styled(Icon)`
  svg {
    width: 30px;
    height: 30px;
  }
`;

export const ConversionCompleteLayout = (
  props: ConversionCompleteLayoutProps,
) => {
  return (
    <div className="flex flex-col items-center justify-center h-39">
      <StyledHugeIcon clickable={false} name={AlertIcons[props.alertType]} />
      <Text className="pt-4 pb-1" type={TextType.H4}>
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
