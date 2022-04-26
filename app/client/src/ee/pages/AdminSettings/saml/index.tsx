import React from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import ReadMetadata from "./ReadMetadata";
import {
  Wrapper,
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
  RaisedCard,
  HeaderSecondary,
  SettingsFormWrapper,
} from "./components";
import AdminConfig from "pages/Settings/config";
import RestartBanner from "pages/Settings/RestartBanner";
import { BottomSpace } from "pages/Settings/SettingsForm";
import { DisconnectService } from "pages/Settings/DisconnectService";
import { fetchSamlMetadata } from "@appsmith/actions/settingsAction";
import { connectedMethods } from "@appsmith/utils/adminSettingsHelpers";
import { Toaster, Variant } from "components/ads";

function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

function getSettingDetail(category: string, subCategory: string) {
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
    Toaster.show({
      text: "Cannot disconnect the only connected authentication method.",
      variant: Variant.danger,
    });
  };

  const disconnect = () => {
    if (connectedMethods.length >= 2) {
      dispatch(fetchSamlMetadata({ isEnabled: false }));
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
              subHeader="Changes to this section can disrupt user authentication. Proceed with caution"
              warning="SAML 2.0 will be removed as primary method of authentication"
            />
          </>
        )}
        <BottomSpace />
      </SettingsFormWrapper>
      <RestartBanner />
    </Wrapper>
  );
}
