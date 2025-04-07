import { createMessage } from "ee/constants/messages";
import React from "react";
import styled from "styled-components";
import { Icon, Tooltip, Text, Link } from "@appsmith/ads";
import type { Setting } from "ee/pages/AdminSettings/config/types";
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
`;

export const StyledLabel = styled.div`
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);

  .admin-settings-form-group-label {
    font-weight: var(--ads-v2-h5-font-weight);
  }

  .help-icon {
    cursor: pointer;
  }
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

export const StyledLink = styled(Link)`
  .ads-v2-link__text {
    font-weight: 600;
  }
  margin-top: 8px;
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
            {setting.isRequired && (
              <StyledAsterisk renderAs="span">*</StyledAsterisk>
            )}
          </Text>
        )}
        {setting.helpText && (
          <Tooltip content={createMessage(() => setting.helpText || "")}>
            <Icon
              className={"help-icon"}
              color="var(--ads-v2-color-fg)"
              data-testid="admin-settings-form-group-helptext"
              name="question-line"
              size="md"
            />
          </Tooltip>
        )}
        {setting.isFeatureEnabled === false &&
          (setting.isEnterprise === true ? <EnterpriseTag /> : <BusinessTag />)}
      </StyledLabel>
      {children}
      {setting.subText &&
        (setting.subTextLink ? (
          <StyledLink kind="secondary" target="_blank" to={setting.subTextLink}>
            {createMessage(() => setting.subText || "")}
          </StyledLink>
        ) : (
          <StyledSubtext
            data-testid="admin-settings-form-group-subtext"
            renderAs="p"
          >
            {createMessage(() => setting.subText || "")}
          </StyledSubtext>
        ))}
    </StyledFormGroup>
  );
}

export interface SettingComponentProps {
  setting: Setting;
}
