import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import styled from "styled-components";
import { Icon, Tooltip, Text } from "design-system";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";
import EnterpriseTag from "components/EnterpriseTag";
import BusinessTag from "components/BusinessTag";

interface FieldHelperProps {
  setting: Setting;
  children: React.ReactNode;
  className?: string;
  isToggle?: boolean;
}

export const StyledFormGroup = styled.div`
  width: 40rem;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  &.t--admin-settings-dropdown {
    div {
      width: 100%;
    }
  }
  & svg:hover {
    cursor: default;
    path {
    }
  }
`;

export const StyledLabel = styled.div`
  margin-bottom: 4px;
  display: flex;
  align-items: center;
`;

export const StyledSubtext = styled(Text)`
  font-size: 12px;
  color: var(--ads-v2-color-fg-muted);
  margin-top: 4px;
`;

export const StyledAsterisk = styled(Text)`
  color: var(--ads-v2-color-fg-error);
  margin-left: 2px;
  font-weight: 500;
`;

export function FormGroup({ children, className, setting }: FieldHelperProps) {
  return (
    <StyledFormGroup
      className={`${className}`}
      data-testid="admin-settings-form-group"
    >
      <StyledLabel className="styled-label">
        {setting.label && (
          <Text
            className="admin-settings-form-group-label"
            color="var(--ads-v2-color-fg)"
            data-testid="admin-settings-form-group-label"
            kind="body-m"
            renderAs="label"
          >
            {setting.label || ""}
          </Text>
        )}
        {setting.isRequired && (
          <StyledAsterisk renderAs="span">*</StyledAsterisk>
        )}
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
        <div className="ml-2">
          {setting.isFeatureEnabled === false &&
            (setting.isEnterprise === true ? (
              <EnterpriseTag />
            ) : (
              <BusinessTag />
            ))}
        </div>
      </StyledLabel>
      {children}
      {setting.subText && (
        <StyledSubtext
          data-testid="admin-settings-form-group-subtext"
          renderAs="p"
        >
          {createMessage(() => setting.subText || "")}
        </StyledSubtext>
      )}
    </StyledFormGroup>
  );
}

export interface SettingComponentProps {
  setting: Setting;
}
