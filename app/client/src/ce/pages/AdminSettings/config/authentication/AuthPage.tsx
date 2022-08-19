import React from "react";
import { useHistory } from "react-router-dom";
import { SettingCategories } from "../types";
import styled from "styled-components";
import Button, { Category } from "components/ads/Button";
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
import { Callout, CalloutType } from "components/ads/CalloutV2";
import { getAppsmithConfigs } from "@appsmith/configs";
import { Colors } from "constants/Colors";
import Icon from "components/ads/Icon";
import { TooltipComponent } from "design-system";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";

const { intercomAppID } = getAppsmithConfigs();

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: 112px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

const SettingsFormWrapper = styled.div``;

const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0;
`;

const SettingsSubHeader = styled.div`
  font-size: 14px;
  margin-bottom: 0;
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

  svg {
    width: 14px;
    height: 14px;
  }
`;

const MethodDets = styled.div`
  font-size: 12px;
  line-height: 16px;
`;

export type calloutType = "LINK" | "OTHER";

export type banner = {
  actionLabel: string;
  title: string;
  type: CalloutType;
};

export type AuthMethodType = {
  id: string;
  category?: string;
  label: string;
  subText?: string;
  image?: any;
  needsUpgrade?: boolean;
  type: calloutType;
  isConnected?: boolean;
  calloutBanner?: banner;
};

const StyledAuthButton = styled(Button)`
  height: 30px;
  width: 94px;
  padding: 8px 16px;
`;

const Label = styled.span<{ enterprise?: boolean }>`
  display: inline;
  ${(props) =>
    props.enterprise
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

export function AuthPage({ authMethods }: { authMethods: AuthMethodType[] }) {
  const history = useHistory();

  const triggerIntercom = (authLabel: string) => {
    if (intercomAppID && window.Intercom) {
      window.Intercom(
        "showNewMessage",
        createMessage(UPGRADE_TO_EE, authLabel),
      );
    }
  };

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
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_UPGRADE_AUTH_METHOD", {
        method: method.label,
      });
      triggerIntercom(method.label);
    }
  };

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
                        <Label enterprise>Enterprise</Label>
                        &nbsp;
                      </>
                    )}
                    {method.isConnected && (
                      <TooltipComponent
                        autoFocus={false}
                        content={createMessage(
                          AUTHENTICATION_METHOD_ENABLED,
                          method.label,
                        )}
                        hoverOpenDelay={0}
                        minWidth={"180px"}
                        openOnTargetFocus={false}
                        position="right"
                      >
                        <Icon
                          className={`${method.category}-green-check`}
                          fillColor={Colors.GREEN}
                          name="oval-check"
                        />
                      </TooltipComponent>
                    )}
                  </MethodTitle>
                  <MethodDets>{method.subText}</MethodDets>
                  {method.calloutBanner && (
                    <Callout
                      actionLabel={method.calloutBanner.actionLabel}
                      desc={method.calloutBanner.title}
                      type={method.calloutBanner.type}
                    />
                  )}
                </MethodDetailsWrapper>
                <StyledAuthButton
                  category={
                    method.isConnected ? Category.primary : Category.tertiary
                  }
                  className={`t--settings-sub-category-${
                    method.needsUpgrade
                      ? `upgrade-${method.category}`
                      : method.category
                  }`}
                  data-cy="btn-auth-account"
                  onClick={() => onClickHandler(method)}
                  text={createMessage(
                    method.isConnected
                      ? EDIT
                      : !!method.needsUpgrade
                      ? UPGRADE
                      : ENABLE,
                  )}
                />
              </MethodCard>
            );
          })}
      </SettingsFormWrapper>
    </Wrapper>
  );
}
