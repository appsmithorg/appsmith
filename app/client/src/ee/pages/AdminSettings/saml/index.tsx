import React from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import ReadMetadata from "./ReadMetadata";
import { RaisedCard, HeaderSecondary } from "./components";
import {
  Wrapper,
  BottomSpace,
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
  SettingsFormWrapper,
} from "pages/Settings/components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import RestartBanner from "pages/Settings/RestartBanner";
import { DisconnectService } from "pages/Settings/DisconnectService";
import { fetchSamlMetadata } from "@appsmith/actions/settingsAction";
import { connectedMethods } from "@appsmith/utils/adminSettingsHelpers";
import {
  createMessage,
  DISCONNECT_AUTH_ERROR,
  DISCONNECT_SERVICE_SUBHEADER,
  DISCONNECT_SERVICE_WARNING,
} from "@appsmith/constants/messages";
import { Toaster, Variant } from "components/ads";
import AnalyticsUtil from "utils/AnalyticsUtil";

export function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

export function getSettingDetail(category: string, subCategory: string) {
  return AdminConfig.getCategoryDetails(category, subCategory);
}

export function SamlAuthTest() {
  return (
    <RaisedCard>
      <HeaderSecondary>Authentication Successful!</HeaderSecondary>
    </RaisedCard>
  );
}

export function Sso() {
  const params = useParams() as any;
  const { category, subCategory } = params;
  const details = getSettingDetail(category, subCategory);
  const pageTitle = getSettingLabel(
    details?.title || (subCategory ?? category),
  );
  const dispatch = useDispatch();
  const saved = details?.isConnected ? true : false;

  const saveBlocked = () => {
    AnalyticsUtil.logEvent("ADMIN_SETTINGS_ERROR", {
      error: createMessage(DISCONNECT_AUTH_ERROR),
    });
    Toaster.show({
      text: createMessage(DISCONNECT_AUTH_ERROR),
      variant: Variant.danger,
    });
  };

  const disconnect = () => {
    if (connectedMethods.length >= 2) {
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
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader>{pageTitle}</SettingsHeader>
          {details?.subText && (
            <SettingsSubHeader>{details.subText}</SettingsSubHeader>
          )}
        </HeaderWrapper>
        {!saved && <ReadMetadata />}
        {saved && (
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
