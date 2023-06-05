import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import ReadMetadata from "./ReadMetadata";
import { RaisedCard } from "./components";
import {
  Wrapper,
  BottomSpace,
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
  SettingsFormWrapper,
} from "pages/Settings/components";
import { BackButton } from "components/utils/helperComponents";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import RestartBanner from "pages/Settings/RestartBanner";
import { DisconnectService } from "pages/Settings/DisconnectService";
import { fetchSamlMetadata } from "@appsmith/actions/settingsAction";
import {
  createMessage,
  DISCONNECT_AUTH_ERROR,
  DISCONNECT_SERVICE_SUBHEADER,
  DISCONNECT_SERVICE_WARNING,
} from "@appsmith/constants/messages";
import { Text, toast } from "design-system";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  getIsFormLoginEnabled,
  getThirdPartyAuths,
} from "@appsmith/selectors/tenantSelectors";

export function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

export function getSettingDetail(category: string, subCategory: string) {
  return AdminConfig.getCategoryDetails(category, subCategory);
}

export function SamlAuthTest() {
  return (
    <RaisedCard>
      <Text kind="heading-m" renderAs="h3">
        Authentication successful!
      </Text>
    </RaisedCard>
  );
}

export function Saml() {
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const details = getSettingDetail(category, subCategory);
  const pageTitle = getSettingLabel(
    details?.title || (subCategory ?? category),
  );
  const dispatch = useDispatch();
  const isFormLoginEnabled = useSelector(getIsFormLoginEnabled);
  const socialLoginList = useSelector(getThirdPartyAuths);
  const isConnected = socialLoginList.includes("saml");

  const saveBlocked = () => {
    AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
      error: createMessage(DISCONNECT_AUTH_ERROR),
    });
    toast.show(createMessage(DISCONNECT_AUTH_ERROR), {
      kind: "error",
    });
  };

  const disconnect = () => {
    const connectedMethodsCount =
      socialLoginList.length + (isFormLoginEnabled ? 1 : 0);
    if (connectedMethodsCount >= 2) {
      dispatch(fetchSamlMetadata({ isEnabled: false }));
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_DISCONNECT_AUTH_METHOD", {
        method: pageTitle,
      });
    } else {
      saveBlocked();
    }
  };

  return (
    <Wrapper>
      {subCategory && <BackButton />}
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            {pageTitle}
          </SettingsHeader>
          {details?.subText && (
            <SettingsSubHeader
              color="var(--ads-v2-color-fg-emphasis)"
              kind="body-m"
              renderAs="h2"
            >
              {details.subText}
            </SettingsSubHeader>
          )}
        </HeaderWrapper>
        {!isConnected && <ReadMetadata />}
        {isConnected && (
          <>
            <SamlAuthTest />
            <DisconnectService
              disconnect={() => disconnect()}
              subHeader={createMessage(DISCONNECT_SERVICE_SUBHEADER)}
              warning={`SAML 2.0 ${createMessage(DISCONNECT_SERVICE_WARNING)}`}
            />
          </>
        )}
        <BottomSpace />
      </SettingsFormWrapper>
      <RestartBanner />
    </Wrapper>
  );
}
