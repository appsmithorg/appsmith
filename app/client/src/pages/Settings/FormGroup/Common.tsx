import Tooltip from "components/ads/Tooltip";
import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Setting } from "@appsmith/pages/AdminSettings/config/types";
import { Colors } from "constants/Colors";

type FieldHelperProps = {
  setting: Setting;
  children: React.ReactNode;
  className?: string;
};

const StyledIcon = styled(Icon)`
  width: 20px;
`;

export const StyledFormGroup = styled.div`
  width: 634px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  & span.bp3-popover-target {
    display: inline-block;
    background: ${(props) => props.theme.colors.menuItem.normalIcon};
    border-radius: ${(props) => props.theme.radii[2]}px;
    width: 14px;
    padding: 3px 3px;
    position: relative;
    top: -2px;
    left: 6px;
    cursor: default;
  }
  & svg:hover {
    cursor: default;
    path {
      fill: #fff;
    }
  }
`;

export const StyledLabel = styled.label`
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  display: inline-block;
  ${(props) => getTypographyByKey(props, "h5")}
  color: ${(props) => props.theme.colors.textInput.normal.text};
`;

export const StyledSubtext = styled.p`
  font-size: 12px;
  color: ${Colors.GRAY};
`;

export function FormGroup({ children, className, setting }: FieldHelperProps) {
  return (
    <StyledFormGroup
      className={className}
      data-testid="admin-settings-form-group"
    >
      <StyledLabel data-testid="admin-settings-form-group-label">
        {createMessage(() => setting.label || "")}
      </StyledLabel>
      {setting.helpText && (
        <Tooltip content={createMessage(() => setting.helpText || "")}>
          <StyledIcon
            data-testid="admin-settings-form-group-helptext"
            fillColor="#fff"
            name="help"
            size={IconSize.XXS}
          />
        </Tooltip>
      )}
      {children}
      {setting.subText && (
        <StyledSubtext data-testid="admin-settings-form-group-subtext">
          * {createMessage(() => setting.subText || "")}
        </StyledSubtext>
      )}
    </StyledFormGroup>
  );
}

export type SettingComponentProps = {
  setting: Setting;
};
