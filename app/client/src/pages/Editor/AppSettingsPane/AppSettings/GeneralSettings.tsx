import { updateApplication } from "ee/actions/applicationActions";
import type { UpdateApplicationPayload } from "ee/api/ApplicationApi";
import {
  GENERAL_SETTINGS_APP_ICON_LABEL,
  GENERAL_SETTINGS_APP_NAME_LABEL,
  GENERAL_SETTINGS_NAME_EMPTY_MESSAGE,
} from "ee/constants/messages";
import classNames from "classnames";
import type { AppIconName } from "@appsmith/ads-old";
import { Input, Text } from "@appsmith/ads";
import { IconSelector } from "@appsmith/ads-old";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getIsSavingAppName,
} from "ee/selectors/applicationSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import styled from "styled-components";
import TextLoaderIcon from "../Components/TextLoaderIcon";

const IconSelectorWrapper = styled.div`
  position: relative;
  .icon-selector {
    max-height: 100px;
    padding: 0;
    .t--icon-selected,
    .t--icon-not-selected {
      margin: 0;
    }
    gap: 2px;
  }

  .t--icon-selected {
    background-color: var(--ads-v2-color-bg-muted);
    svg path {
      fill: var(--ads-v2-color-fg);
    }
  }

  .t--icon-not-selected {
    background-color: transparent;
    svg path {
      fill: var(--ads-v2-color-fg);
    }
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
    !isSavingAppName && setApplicationName(application?.name);
  }, [application, application?.name, isSavingAppName]);

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

  const onChange = (value: string) => {
    if (!value || value.trim().length === 0) {
      setIsAppNameValid(false);
    } else {
      if (!isSavingAppName) {
        setIsAppNameValid(true);
      }
    }

    setApplicationName(value);
  };

  return (
    <>
      <div
        className={classNames({
          "pt-1 pb-2 relative": true,
          "pb-4": !isAppNameValid,
        })}
      >
        {isSavingAppName && <TextLoaderIcon />}
        <Input
          defaultValue={applicationName}
          errorMessage={
            isAppNameValid ? undefined : GENERAL_SETTINGS_NAME_EMPTY_MESSAGE()
          }
          // undefined sent implicitly - parameter "icon"
          id="t--general-settings-app-name"
          isValid={isAppNameValid}
          label={GENERAL_SETTINGS_APP_NAME_LABEL()}
          onBlur={() => updateAppSettings()}
          onChange={onChange}
          onKeyPress={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              // undefined sent implicitly - parameter "icon"
              updateAppSettings();
            }
          }}
          placeholder="App name"
          size="md"
          type="text"
          value={applicationName}
        />
      </div>

      <Text kind="action-m">{GENERAL_SETTINGS_APP_ICON_LABEL()}</Text>
      <IconSelectorWrapper className="pt-1" id="t--general-settings-app-icon">
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
