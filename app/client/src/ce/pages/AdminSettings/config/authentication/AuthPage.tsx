import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { SettingCategories } from "../types";
import styled from "styled-components";
import Button, { Category } from "components/ads/Button";
import {
  ADD,
  ADMIN_AUTH_SETTINGS_SUBTITLE,
  ADMIN_AUTH_SETTINGS_TITLE,
  createMessage,
  EDIT,
  UPGRADE,
  UPGRADE_TO_EE,
} from "@appsmith/constants/messages";
import { getAdminSettingsCategoryUrl } from "constants/routes";
import Icon, { IconSize } from "components/ads/Icon";
import { Callout, CalloutType } from "components/ads/CalloutV2";
import SettingsBreadcrumbs from "pages/Settings/SettingsBreadcrumbs";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import { bootIntercom } from "utils/helpers";
import { Colors } from "constants/Colors";

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

const EditButton = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const AddButton = styled(Button)`
  height: 30px;
  padding: 8px 16px;
`;

const ButtonTitle = styled.span`
  margin-right: 2px;
  font-size: 11px;
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
    color: #03B365;
    background: #E5F6EC;
  `};
  padding: 0px 4px;
  font-size: 12px;
`;

export function AuthPage({ authMethods }: { authMethods: AuthMethodType[] }) {
  const history = useHistory();
  const user = useSelector(getCurrentUser);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  const triggerIntercom = (authLabel: string) => {
    if (intercomAppID && window.Intercom) {
      window.Intercom(
        "showNewMessage",
        createMessage(UPGRADE_TO_EE, authLabel),
      );
    }
  };

  return (
    <Wrapper>
      <SettingsBreadcrumbs category={SettingCategories.AUTHENTICATION} />
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
                    {method.isConnected && <Label>Enabled</Label>}
                    {method.needsUpgrade && (
                      <Label enterprise>Enterprise</Label>
                    )}
                  </MethodTitle>
                  <MethodDets>{method.subText}</MethodDets>
                  {method.calloutBanner && (
                    <Callout
                      actionLabel={method.calloutBanner.actionLabel}
                      title={method.calloutBanner.title}
                      type={method.calloutBanner.type}
                    />
                  )}
                </MethodDetailsWrapper>
                {method.isConnected ? (
                  <EditButton
                    className={`t--settings-sub-category-${method.category}`}
                    onClick={() =>
                      history.push(
                        getAdminSettingsCategoryUrl(
                          SettingCategories.AUTHENTICATION,
                          method.category,
                        ),
                      )
                    }
                  >
                    <ButtonTitle>{createMessage(EDIT)}</ButtonTitle>
                    <Icon name="right-arrow" size={IconSize.XL} />
                  </EditButton>
                ) : (
                  <AddButton
                    category={Category.tertiary}
                    className={`add-button t--settings-sub-category-${
                      method.needsUpgrade ? "upgrade" : method.category
                    }`}
                    data-cy="add-auth-account"
                    onClick={() =>
                      !method.needsUpgrade
                        ? history.push(
                            getAdminSettingsCategoryUrl(
                              SettingCategories.AUTHENTICATION,
                              method.category,
                            ),
                          )
                        : triggerIntercom(method.label)
                    }
                    text={createMessage(!!method.needsUpgrade ? UPGRADE : ADD)}
                  />
                )}
              </MethodCard>
            );
          })}
      </SettingsFormWrapper>
    </Wrapper>
  );
}
