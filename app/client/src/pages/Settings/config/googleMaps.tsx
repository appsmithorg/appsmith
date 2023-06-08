import React from "react";
import type { ReactElement } from "react";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { Callout, Button, Input } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getGoogleMapsApiKey } from "@appsmith/selectors/tenantSelectors";
import {
  Wrapper,
  SettingsHeader,
} from "@appsmith/pages/AdminSettings/config/authentication/AuthPage";
import { createMessage, LEARN_MORE } from "@appsmith/constants/messages";
import { GOOGLE_MAPS_SETUP_DOC } from "constants/ThirdPartyConstants";
import { saveSettings } from "@appsmith/actions/settingsAction";
import { HeaderWrapper, SettingsFormWrapper } from "../components";

export const config: AdminConfigType = {
  icon: "map-pin-2-line",
  type: SettingCategories.GOOGLE_MAPS,
  controlType: SettingTypes.PAGE,
  title: "Google Maps",
  canSave: false,
  component: GoogleMapsConfig,
};

function GoogleMapsConfig(): ReactElement<any, any> {
  const googleMapsApiKey = useSelector(getGoogleMapsApiKey) ?? "";
  const [mapsKey, setMapsKey] = React.useState<string>(googleMapsApiKey);
  const dispatch = useDispatch();

  const isModified = googleMapsApiKey === mapsKey;

  function onSave() {
    dispatch(
      saveSettings(
        {
          APPSMITH_GOOGLE_MAPS_API_KEY: mapsKey,
        },
        false,
      ),
    );
  }

  function onReset() {
    setMapsKey(googleMapsApiKey);
  }

  return (
    <Wrapper>
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            {config.title}
          </SettingsHeader>
        </HeaderWrapper>
        <div className="flex flex-col gap-4">
          <Callout
            kind="info"
            links={[
              {
                children: createMessage(LEARN_MORE),
                to: GOOGLE_MAPS_SETUP_DOC,
              },
            ]}
          >
            {createMessage(() => "How to configure?")}
          </Callout>
          <Input
            id="APPSMITH_GOOGLE_MAPS_API_KEY"
            isValid={mapsKey.trim() !== ""}
            label="Google Maps API Key"
            onChange={setMapsKey}
            size="md"
            value={mapsKey}
          />
          <div className="flex gap-2">
            <Button
              className="t--admin-settings-save-button"
              isDisabled={isModified || mapsKey.length === 0}
              onClick={onSave}
              size="md"
            >
              {createMessage(() => "Save")}
            </Button>
            <Button
              className="t--admin-settings-reset-button"
              isDisabled={isModified}
              kind="secondary"
              onClick={onReset}
              size="md"
            >
              {createMessage(() => "Reset")}
            </Button>
          </div>
        </div>
      </SettingsFormWrapper>
    </Wrapper>
  );
}
