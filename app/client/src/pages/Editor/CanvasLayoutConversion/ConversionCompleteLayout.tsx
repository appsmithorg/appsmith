import React from "react";
import styled from "styled-components";

import { Callout, Icon, Text } from "@appsmith/ads";
import { AlertType } from "reducers/uiReducers/layoutConversionReducer";

const AlertIcons = {
  [AlertType.SUCCESS]: {
    name: "success",
    color: "var(--ads-v2-color-fg-success)",
  },
  [AlertType.WARNING]: {
    name: "warning-line",
    color: "var(--ads-v2-color-fg-warning)",
  },
  [AlertType.ERROR]: {
    name: "error",
    color: "var(--ads-v2-color-bg)",
  },
};

export interface ConversionCompleteLayoutProps {
  alertType: AlertType;
  headerText: string;
  infoText: string;
  errorText?: string;
}

const StyledHugeIcon = styled(Icon)`
  svg {
    width: 30px;
    height: 30px;
  }
`;

export const ConversionCompleteLayout = (
  props: ConversionCompleteLayoutProps,
) => {
  const icon = AlertIcons[props.alertType];

  if (props.alertType === AlertType.ERROR) {
    return (
      <Callout className="mb-3" kind="error">
        <div className="flex flex-col">
          <Text kind="heading-s" renderAs="h4">
            {props.headerText}
          </Text>
          {props.errorText && (
            <Text kind="action-m" renderAs="p">
              {props.errorText}. {props.infoText}
            </Text>
          )}
        </div>
      </Callout>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-39">
      <StyledHugeIcon color={icon.color} name={icon.name} />
      <Text className="pt-4 pb-1" kind="heading-m" renderAs="h4">
        {props.headerText}
      </Text>
      {props.errorText && (
        <Text kind="action-l" renderAs="p">
          {props.errorText}
        </Text>
      )}
      <Text kind="action-l" renderAs="p">
        {props.infoText}
      </Text>
    </div>
  );
};
