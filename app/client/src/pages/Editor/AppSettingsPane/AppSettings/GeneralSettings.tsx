import { updateApplication } from "actions/applicationActions";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import {
  GENERAL_SETTINGS_APP_ICON_LABEL,
  GENERAL_SETTINGS_APP_NAME_LABEL,
  URL_FIELD_SPECIAL_CHARACTER_ERROR,
} from "ce/constants/messages";
import {
  AppIconName,
  TextInput,
  IconSelector,
  Text,
  TextType,
} from "design-system";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getIsSavingAppName,
} from "selectors/applicationSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import styled from "styled-components";
import { checkRegex } from "utils/validation/CheckRegex";
import TextLoaderIcon from "../Components/TextLoaderIcon";
import { specialCharacterCheckRegex } from "../Utils";

const IconSelectorWrapper = styled.div`
  position: relative;
  .icon-selector {
    max-height: 100px;
    padding: 0;
    .t--icon-selected,
    .t--icon-not-selected {
      margin: 0;
    }
    gap: 3px;
  }
  .icon-selector::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  .icon-selector::-webkit-scrollbar {
    width: 0px;
  }
`;

function GeneralSettings() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const application = useSelector(getCurrentApplication);
  const isSavingAppName = useSelector(getIsSavingAppName);

  const [applicationName, setApplicationName] = useState(application?.name);
  const [isAppNameValid, setIsAppNameValid] = useState(true);
  const [applicationIcon, setApplicationIcon] = useState(
    application?.icon as AppIconName,
  );

  useEffect(() => {
    setApplicationName(application?.name);
  }, [application?.name]);

  const updateAppSettings = useCallback(
    debounce((icon?: AppIconName) => {
      const isAppNameUpdated = applicationName !== application?.name;

      const payload: UpdateApplicationPayload = { currentApp: true };
      if (isAppNameUpdated && isAppNameValid) {
        payload.name = applicationName;
      }
      icon ? (payload.icon = icon) : null;

      (isAppNameUpdated || icon) &&
        dispatch(updateApplication(applicationId, payload));
    }, 50),
    [applicationName, application, applicationId],
  );

  return (
    <>
      <Text type={TextType.P1}>{GENERAL_SETTINGS_APP_NAME_LABEL()}</Text>
      <div className="pt-1 pb-2 relative">
        {isSavingAppName && <TextLoaderIcon />}
        <TextInput
          fill
          // undefined sent implicitly - parameter "icon"
          onBlur={() => updateAppSettings()}
          onChange={(value: string) =>
            !isSavingAppName && setApplicationName(value)
          }
          onKeyPress={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              updateAppSettings();
            }
          }}
          placeholder="App name"
          type="input"
          validator={checkRegex(
            specialCharacterCheckRegex,
            URL_FIELD_SPECIAL_CHARACTER_ERROR(),
            true,
            setIsAppNameValid,
          )}
          value={applicationName}
        />
      </div>

      <Text type={TextType.P1}>{GENERAL_SETTINGS_APP_ICON_LABEL()}</Text>
      <IconSelectorWrapper className="pt-1">
        <IconSelector
          className="icon-selector"
          fill
          onSelect={(icon: AppIconName) => {
            setApplicationIcon(icon);
            // updateAppSettings - passing `icon` because `applicationIcon`
            // will be not updated untill the component is re-rendered
            updateAppSettings(icon);
          }}
          selectedColor="black"
          selectedIcon={applicationIcon}
        />
      </IconSelectorWrapper>
    </>
  );
}

export default GeneralSettings;
