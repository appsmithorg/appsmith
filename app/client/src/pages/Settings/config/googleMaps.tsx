import React, { ReactElement } from "react";
import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import {
  CalloutV2,
  Category,
  notEmptyValidator,
  TextInput,
} from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import { getGoogleMapsApiKey } from "../../../ce/selectors/tenantSelectors";
import {
  Wrapper,
  SettingsHeader,
} from "../../../ce/pages/AdminSettings/config/authentication/AuthPage";
import { createMessage, LEARN_MORE } from "../../../ce/constants/messages";
import { GOOGLE_MAPS_SETUP_DOC } from "../../../constants/ThirdPartyConstants";
import { MaxWidthWrapper } from "../components";
import { StyledClearButton, StyledSaveButton } from "../SaveSettings";
import { saveSettings } from "../../../ce/actions/settingsAction";

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
      <MaxWidthWrapper>
        <SettingsHeader>{config.title}</SettingsHeader>
        <div
          className="callout-link t--read-more-link"
          data-testid="admin-settings-group-link"
          key="APPSMITH_GOOGLE_MAPS_API_KEY"
        >
          <CalloutV2
            actionLabel={createMessage(LEARN_MORE)}
            desc={createMessage(() => "How to configure?")}
            type="Notify"
            url={GOOGLE_MAPS_SETUP_DOC}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="font-semibold"
            htmlFor="APPSMITH_GOOGLE_MAPS_API_KEY"
          >
            Google Maps API Key
          </label>
          <TextInput
            cypressSelector="t--display-name"
            fill={false}
            id="APPSMITH_GOOGLE_MAPS_API_KEY"
            onChange={setMapsKey}
            validator={notEmptyValidator}
            value={mapsKey}
          />
        </div>
        <div className="flex gap-2 mt-6">
          <StyledSaveButton
            category={Category.primary}
            className="t--admin-settings-save-button"
            disabled={isModified || mapsKey.length === 0}
            onClick={onSave}
            tag="button"
            text={createMessage(() => "Save")}
          />
          <StyledClearButton
            category={Category.secondary}
            className="t--admin-settings-reset-button"
            disabled={isModified}
            onClick={onReset}
            tag="button"
            text={createMessage(() => "Reset")}
          />
        </div>
      </MaxWidthWrapper>
    </Wrapper>
  );
}
