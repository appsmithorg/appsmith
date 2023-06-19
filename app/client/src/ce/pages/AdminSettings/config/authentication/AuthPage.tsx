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
  AUTHENTICATION_METHOD_ENABLED,
  BUSINESS_TAG,
} from "@appsmith/constants/messages";
import {
  Button,
  Callout,
  Divider,
  Icon,
  Tag,
  Text,
  Tooltip,
} from "design-system";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import useOnUpgrade from "utils/hooks/useOnUpgrade";

export const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding: var(--ads-v2-spaces-7);
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

export const SettingsFormWrapper = styled.div`
  max-width: 40rem;
`;

export const SettingsHeader = styled(Text)``;

export const SettingsSubHeader = styled(Text)`
  margin-bottom: 24px;
`;

const MethodCard = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0 0;

  > .ads-v2-icon {
    margin-right: 8px;
    object-fit: cover;
    border-radius: 50%;
    padding: 5px;
    align-self: baseline;
  }
`;

const Image = styled.img`
  width: 32px;
  height: 32px;
  margin-right: 8px;
  object-fit: cover;
  border-radius: 50%;
  padding: 5px;
  align-self: baseline;
`;

const MethodDetailsWrapper = styled.div`
  color: var(--ads-v2-color-fg-muted);
  width: 492px;
  margin-right: 60px;
`;

const MethodTitle = styled(Text)`
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

const MethodDets = styled(Text)``;

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
  icon?: string;
};

const ButtonWrapper = styled.div`
  min-width: 100px;
  text-align: right;
`;

export function ActionButton({ method }: { method: AuthMethodType }) {
  const history = useHistory();
  const { onUpgrade } = useOnUpgrade({
    logEventName: "ADMIN_SETTINGS_UPGRADE_AUTH_METHOD",
    logEventData: { method: method.label },
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
    <ButtonWrapper>
      <Button
        className={`t--settings-sub-category-${
          method.needsUpgrade ? `upgrade-${method.category}` : method.category
        }`}
        data-testid="btn-auth-account"
        kind={"secondary"}
        onClick={() => onClickHandler(method)}
        size="md"
      >
        {createMessage(
          method.isConnected ? EDIT : !!method.needsUpgrade ? UPGRADE : ENABLE,
        )}
      </Button>
    </ButtonWrapper>
  );
}

export function AuthPage({ authMethods }: { authMethods: AuthMethodType[] }) {
  return (
    <Wrapper>
      <SettingsFormWrapper>
        <SettingsHeader
          color="var(--ads-v2-color-fg-emphasis-plus)"
          kind="heading-l"
          renderAs="h1"
        >
          {createMessage(ADMIN_AUTH_SETTINGS_TITLE)}
        </SettingsHeader>
        <SettingsSubHeader
          color="var(--ads-v2-color-fg-emphasis)"
          kind="body-m"
          renderAs="h2"
        >
          {createMessage(ADMIN_AUTH_SETTINGS_SUBTITLE)}
        </SettingsSubHeader>
        {authMethods &&
          authMethods.map((method) => {
            return (
              <div key={method.id}>
                <MethodCard>
                  {method.icon ? (
                    <Icon name={method.icon} size="lg" />
                  ) : (
                    <Image alt={method.label} src={method.image} />
                  )}
                  <MethodDetailsWrapper>
                    <MethodTitle
                      color="var(--ads-v2-color-fg)"
                      kind="heading-s"
                      renderAs="p"
                    >
                      {method.label}&nbsp;
                      {method.needsUpgrade && (
                        <Tag isClosable={false}>
                          {createMessage(BUSINESS_TAG)}
                        </Tag>
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
                            color="var(--ads-v2-color-fg-success)"
                            name="oval-check-fill"
                          />
                        </Tooltip>
                      )}
                    </MethodTitle>
                    <MethodDets
                      color="var(--ads-v2-color-fg)"
                      kind="body-s"
                      renderAs="p"
                    >
                      {method.subText}
                    </MethodDets>
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
                <Divider />
              </div>
            );
          })}
      </SettingsFormWrapper>
    </Wrapper>
  );
}
