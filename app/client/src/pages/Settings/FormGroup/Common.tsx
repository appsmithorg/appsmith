import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import styled from "styled-components";
import { Tooltip, Text } from "design-system";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";
import { Icon } from "design-system";

type FieldHelperProps = {
  setting: Setting;
  children: React.ReactNode;
  className?: string;
};

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

export const StyledLabel = styled.div`
  margin-bottom: 8px;
`;

export const StyledSubtext = styled.p`
  font-size: 12px;
  color: var(--ads-v2-color-fg-muted);
`;

export const StyledAsterisk = styled.span`
  color: var(--ads-v2-color-fg-error);
  margin-left: 2px;
`;

export function FormGroup({ children, className, setting }: FieldHelperProps) {
  return (
    <StyledFormGroup
      className={className}
      data-testid="admin-settings-form-group"
    >
      <StyledLabel>
        {setting.label && (
          <Text
            color="var(--ads-v2-color-fg-emphasis)"
            data-testid="admin-settings-form-group-label"
            renderAs="span"
          >
            {createMessage(() => setting.label || "")}
          </Text>
        )}
        {setting.isRequired && <StyledAsterisk>*</StyledAsterisk>}
        {setting.helpText && (
          <Tooltip content={createMessage(() => setting.helpText || "")}>
            <Icon
              color="white"
              data-testid="admin-settings-form-group-helptext"
              name="help"
              size="sm"
            />
          </Tooltip>
        )}
      </StyledLabel>
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
