import React from "react";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "components/ads/Icon";

type LabelProps = {
  text: string;
  color: string;
  iconName: IconName;
  children?: React.ReactNode;
};

const StyledLabel = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  background-color: ${(props) => `${props.color}30`};
  border-radius: 4px;
  padding: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-family: SF Pro Text;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  line-height: 15px;
`;

const Label = ({ text, color, iconName }: LabelProps) => (
  <StyledLabel color={color}>
    <Icon name={iconName} size={IconSize.XL} fillColor={color} />
    <div style={{ marginLeft: 8 }}>{text.toUpperCase()}</div>
  </StyledLabel>
);

export const FeaturesLabel = () => (
  <Label text="features" color="#5BB749" iconName="success" />
);

export const BugFixesLabel = () => (
  <Label text="bug fixes" color="#D6415F" iconName="error" />
);
