import React from "react";
import { useHistory } from "react-router-dom";
import { SettingCategories } from "../types";
import styled from "styled-components";
import {
  ENABLE,
  ADMIN_AUTH_SETTINGS_SUBTITLE,
  ADMIN_AUTH_SETTINGS_TITLE,
  createMessage,
  EDIT,
  UPGRADE,
  UPGRADE_TO_EE,
  AUTHENTICATION_METHOD_ENABLED,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { Button, Callout, Icon, Tooltip } from "design-system";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import useOnUpgrade from "utils/hooks/useOnUpgrade";

export const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding: 40px 0 0 24px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

export const SettingsFormWrapper = styled.div``;

export const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

export const SettingsSubHeader = styled.div`
  font-size: 14px;
  margin-bottom: 0;
  color: var(--ads-v2-color-fg-emphasis);
`;

const MethodCard = styled.div`
  display: flex;
  align-items: center;
  margin: 32px 0;
`;

const Image = styled.img`
  width: 32px;
  height: 32px;
  margin-right: 8px;
  background: #f0f0f0;
  object-fit: cover;
  border-radius: 50%;
  padding: 5px;
  align-self: baseline;
`;

const MethodDetailsWrapper = styled.div`
  color: #2e3d49;
  width: 492px;
  margin-right: 60px;
`;

const MethodTitle = styled.div`
  font-weight: 500;
  font-size: 16px;
  display: flex;
  align-items: center;
  margin: 0 0 4px;
  color: var(--ads-v2-color-fg);

  svg {
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
`;

const MethodDets = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: var(--ads-v2-color-fg);
`;

export type banner = {
  actionLabel: string;
  title: string;
};

export type AuthMethodType = {
  id: string;
  category?: string;
  label: string;
  subText?: string;
  image?: any;
  needsUpgrade?: boolean;
  isConnected?: boolean;
  calloutBanner?: banner;
};

const Label = styled.span<{ business?: boolean }>`
  display: inline;
  ${(props) =>
    props.business
      ? `
    border: 1px solid ${Colors.COD_GRAY};
    color: ${Colors.COD_GRAY};
    background: #fff;
  `
      : `
    color: ${Colors.GREEN};
    background: #E5F6EC;
  `};
  padding: 0px 4px;
  font-size: 12px;
`;

const StyledButton = styled(Button)`
  width: 100px;
`;

export function ActionButton({ method }: { method: AuthMethodType }) {
  const history = useHistory();
  const { onUpgrade } = useOnUpgrade({
    logEventName: "ADMIN_SETTINGS_UPGRADE_AUTH_METHOD",
    logEventData: { method: method.label },
    intercomMessage: createMessage(UPGRADE_TO_EE, method.label),
  });

  const onClickHandler = (method: AuthMethodType) => {
    if (!method.needsUpgrade || method.isConnected) {
      AnalyticsUtil.logEvent(
        method.isConnected
          ? "ADMIN_SETTINGS_EDIT_AUTH_METHOD"
          : "ADMIN_SETTINGS_ENABLE_AUTH_METHOD",
        {
          method: method.label,
        },
      );
      history.push(
        adminSettingsCategoryUrl({
          category: SettingCategories.AUTHENTICATION,
          selected: method.category,
        }),
      );
    } else {
      onUpgrade();
    }
  };

  return (
    <StyledButton
      className={`t--settings-sub-category-${
        method.needsUpgrade ? `upgrade-${method.category}` : method.category
      }`}
      data-cy="btn-auth-account"
      kind={method.isConnected ? "primary" : "secondary"}
      onClick={() => onClickHandler(method)}
      size="sm"
    >
      {createMessage(
        method.isConnected ? EDIT : !!method.needsUpgrade ? UPGRADE : ENABLE,
      )}
    </StyledButton>
  );
}

export function AuthPage({ authMethods }: { authMethods: AuthMethodType[] }) {
  return (
    <Wrapper>
      <SettingsFormWrapper>
        <SettingsHeader>
          {createMessage(ADMIN_AUTH_SETTINGS_TITLE)}
        </SettingsHeader>
        <SettingsSubHeader>
          {createMessage(ADMIN_AUTH_SETTINGS_SUBTITLE)}
        </SettingsSubHeader>
        {authMethods &&
          authMethods.map((method) => {
            return (
              <MethodCard key={method.id}>
                <Image alt={method.label} src={method.image} />
                <MethodDetailsWrapper>
                  <MethodTitle>
                    {method.label}&nbsp;
                    {method.needsUpgrade && (
                      <>
                        <Label business>Business</Label>
                        &nbsp;
                      </>
                    )}
                    {method.isConnected && (
                      <Tooltip
                        content={createMessage(
                          AUTHENTICATION_METHOD_ENABLED,
                          method.label,
                        )}
                        placement="right"
                      >
                        <Icon
                          className={`${method.category}-green-check`}
                          color={Colors.GREEN}
                          name="oval-check"
                        />
                      </Tooltip>
                    )}
                  </MethodTitle>
                  <MethodDets>{method.subText}</MethodDets>
                  {method.calloutBanner && (
                    <Callout
                      kind="info"
                      links={[
                        {
                          children: method.calloutBanner.actionLabel,
                          to: "",
                        },
                      ]}
                    >
                      {method.calloutBanner.title}
                    </Callout>
                  )}
                </MethodDetailsWrapper>
                <ActionButton method={method} />
              </MethodCard>
            );
          })}
      </SettingsFormWrapper>
    </Wrapper>
  );
}
