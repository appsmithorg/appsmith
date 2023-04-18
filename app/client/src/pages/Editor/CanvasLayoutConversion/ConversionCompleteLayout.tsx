import React from "react";
import styled from "styled-components";

import { Icon } from "design-system";
import { AlertType } from "reducers/uiReducers/layoutConversionReducer";

const AlertIcons = {
  [AlertType.ERROR]: {
    name: "success",
    color: "var(--ads-v2-color-fg-success)",
  },
  [AlertType.WARNING]: {
    name: "warning-line",
    color: "var(--ads-v2-color-fg-warning)",
  },
  [AlertType.SUCCESS]: {
    name: "error",
    color: "var(--ads-v2-color-bg)",
  },
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

const Title = styled.h4`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-6);
`;

const SubText = styled.p<{ isError?: boolean }>`
  color: ${({ isError }) =>
    isError
      ? "var(--ads-v2-color-bg-error-emphasis)"
      : "var(--ads-v2-color-fg)"};
  font-weight: var(--ads-v2-font-weight-normal);
  font-size: var(--ads-v2-font-size-4);
`;

export const ConversionCompleteLayout = (
  props: ConversionCompleteLayoutProps,
) => {
  const icon = AlertIcons[props.alertType];

  return (
    <div className="flex flex-col items-center justify-center h-39">
      <StyledHugeIcon color={icon.color} name={icon.name} />
      <Title className="pt-4 pb-1">{props.headerText}</Title>
      {props.errorText && <SubText isError>{props.errorText}</SubText>}
      <SubText>{props.infoText}</SubText>
    </div>
  );
};
