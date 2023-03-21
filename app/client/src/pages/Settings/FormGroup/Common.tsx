import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import styled from "styled-components";
import {
  getTypographyByKey,
  Icon,
  IconSize,
  TooltipComponent as Tooltip,
} from "design-system-old";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";
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
  width: 40rem;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  &.t--admin-settings-dropdown {
    div {
      width: 100%;
      &:hover {
        &:hover {
          background-color: ${(props) => props.theme.colors.textInput.hover.bg};
        }
      }
    }
  }
  & svg:hover {
    cursor: default;
    path {
    }
  }
`;

export const StyledLabel = styled.label`
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  display: inline-block;
  ${getTypographyByKey("h5")}
  color: ${(props) => props.theme.colors.textInput.normal.text};
`;

export const StyledSubtext = styled.p`
  font-size: 12px;
  color: ${Colors.GRAY};
`;

export const StyledAsterisk = styled.span`
  color: ${Colors.ERROR_RED};
  margin-left: 2px;
`;

export function FormGroup({ children, className, setting }: FieldHelperProps) {
  return (
    <StyledFormGroup
      className={className}
      data-testid="admin-settings-form-group"
    >
      {setting.label && (
        <StyledLabel data-testid="admin-settings-form-group-label">
          {createMessage(() => setting.label || "")}
        </StyledLabel>
      )}
      {setting.isRequired && <StyledAsterisk>*</StyledAsterisk>}
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
