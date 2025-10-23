import {
  updateApplication,
  persistAppSlug as persistAppSlugAction,
  validateAppSlug,
  toggleStaticUrl,
} from "ee/actions/applicationActions";
import type { UpdateApplicationPayload } from "ee/api/ApplicationApi";
import {
  GENERAL_SETTINGS_APP_ICON_LABEL,
  GENERAL_SETTINGS_APP_NAME_LABEL,
  GENERAL_SETTINGS_NAME_EMPTY_MESSAGE,
  GENERAL_SETTINGS_APP_URL_LABEL,
  GENERAL_SETTINGS_APP_URL_INVALID_MESSAGE,
  GENERAL_SETTINGS_APP_URL_WARNING_MESSAGE,
  GENERAL_SETTINGS_APP_URL_CHECKING_MESSAGE,
  GENERAL_SETTINGS_APP_URL_AVAILABLE_MESSAGE,
  GENERAL_SETTINGS_APP_URL_UNAVAILABLE_MESSAGE,
  GENERAL_SETTINGS_APP_URL_EMPTY_VALUE_MESSAGE,
} from "ee/constants/messages";
import classNames from "classnames";
import type { AppIconName } from "@appsmith/ads-old";
import { Input, Switch, Text, Icon } from "@appsmith/ads";
import { IconSelector } from "@appsmith/ads-old";
import React, { useCallback, useState } from "react";
import { useEffect } from "react";
import { debounce } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getIsSavingAppName,
  getIsPersistingAppSlug,
  getIsValidatingAppSlug,
  getIsApplicationSlugValid,
  getIsTogglingStaticUrl,
} from "ee/selectors/applicationSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import styled from "styled-components";
import TextLoaderIcon from "./TextLoaderIcon";
import UrlPreview from "./UrlPreview";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

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
  const isApplicationSlugValid = useSelector(getIsApplicationSlugValid);
  const isValidatingAppSlug = useSelector(getIsValidatingAppSlug);

  const [applicationName, setApplicationName] = useState(application?.name);
  const [isAppNameValid, setIsAppNameValid] = useState(true);
  const [applicationIcon, setApplicationIcon] = useState(
    application?.icon as AppIconName,
  );
  const [applicationSlug, setApplicationSlug] = useState(
    application?.uniqueSlug || "",
  );
  const [isStaticUrlToggleEnabled, setIsStaticUrlToggleEnabled] =
    useState(!!applicationSlug);
  const isAppSlugSaving = useSelector(getIsPersistingAppSlug);
  const isStaticUrlFeatureEnabled = useFeatureFlag(
    FEATURE_FLAG.release_static_url_enabled,
  );
  const isTogglingStaticUrl = useSelector(getIsTogglingStaticUrl);

  useEffect(
    function updateApplicationName() {
      !isSavingAppName && setApplicationName(application?.name);
    },
    [application, application?.name, isSavingAppName],
  );

  useEffect(
    function updateApplicationSlug() {
      setApplicationSlug(application?.uniqueSlug || "");
    },
    [application?.uniqueSlug],
  );

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
    [applicationName, application, applicationId, isAppNameValid, dispatch],
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

  const onSlugChange = useCallback(
    (value: string) => {
      // Convert to lowercase and replace spaces with hyphens
      const normalizedValue = value.toLowerCase().replace(/\s+/g, "-");

      if (normalizedValue && normalizedValue.trim().length > 0) {
        // Basic validation: only lowercase letters, numbers, and hyphens
        const isValid = /^[a-z0-9-]+$/.test(normalizedValue);

        if (isValid) {
          // Dispatch validation action instead of persisting
          dispatch(validateAppSlug(normalizedValue));
        }
      }

      setApplicationSlug(normalizedValue);
    },
    [dispatch],
  );

  const onSlugBlur = useCallback(() => {
    // Only persist on blur if the slug is different from current application slug
    if (applicationSlug && applicationSlug !== application?.uniqueSlug) {
      dispatch(persistAppSlugAction(applicationSlug));
    }
  }, [applicationSlug, application?.uniqueSlug, dispatch]);

  const shouldShowUrl = applicationSlug && applicationSlug.trim().length > 0;
  const appUrl = `${window.location.origin}/app/${applicationSlug}`;

  const AppUrlContent = () => (
    <>
      {window.location.origin}/app/
      <strong className={`text-[color:var(--appsmith-color-black-800))]`}>
        {applicationSlug}
      </strong>
    </>
  );

  const handleStaticUrlToggle = useCallback(
    (isEnabled: boolean) => {
      setIsStaticUrlToggleEnabled(isEnabled);

      dispatch(toggleStaticUrl(isEnabled, applicationId));
    },
    [dispatch, applicationId],
  );

  const handleUrlCopy = useCallback(async () => {
    await navigator.clipboard.writeText(appUrl);
  }, [appUrl]);

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

      {isStaticUrlFeatureEnabled && (
        <div className="flex content-center justify-between pt-2">
          {isTogglingStaticUrl && <TextLoaderIcon />}
          <Switch
            className="mb-0"
            id="t--general-settings-static-url"
            isSelected={isStaticUrlToggleEnabled}
            onChange={handleStaticUrlToggle}
          >
            <Text kind="action-m">Static URL</Text>
          </Switch>
        </div>
      )}

      {isStaticUrlFeatureEnabled && isStaticUrlToggleEnabled && (
        <div
          className={classNames({
            "pt-4 pb-2 relative": true,
            "pb-4":
              !applicationSlug ||
              applicationSlug.trim().length === 0 ||
              !isApplicationSlugValid,
          })}
        >
          {isAppSlugSaving && <TextLoaderIcon />}
          <Input
            defaultValue={applicationSlug ? applicationSlug : ""}
            errorMessage={
              !applicationSlug || applicationSlug.trim().length === 0
                ? GENERAL_SETTINGS_APP_URL_EMPTY_VALUE_MESSAGE()
                : isApplicationSlugValid
                  ? undefined
                  : GENERAL_SETTINGS_APP_URL_INVALID_MESSAGE()
            }
            id="t--general-settings-app-url"
            isValid={
              !!applicationSlug &&
              applicationSlug.trim().length > 0 &&
              isApplicationSlugValid
            }
            label={GENERAL_SETTINGS_APP_URL_LABEL()}
            onBlur={onSlugBlur}
            onChange={onSlugChange}
            placeholder="app-url"
            size="md"
            type="text"
            value={applicationSlug}
          />
          {applicationSlug && applicationSlug.trim().length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {isValidatingAppSlug ? (
                <>
                  <Icon
                    color="var(--ads-v2-color-fg-muted)"
                    name="loader-line"
                    size="sm"
                  />
                  <Text
                    kind="body-s"
                    style={{ color: "var(--ads-v2-color-fg-muted)" }}
                  >
                    {GENERAL_SETTINGS_APP_URL_CHECKING_MESSAGE()}
                  </Text>
                </>
              ) : isApplicationSlugValid ? (
                <>
                  <Icon
                    color="var(--ads-v2-color-fg-success)"
                    name="check-line"
                    size="sm"
                  />
                  <Text
                    kind="body-s"
                    style={{ color: "var(--ads-v2-color-fg-success)" }}
                  >
                    {GENERAL_SETTINGS_APP_URL_AVAILABLE_MESSAGE()}
                  </Text>
                </>
              ) : (
                <>
                  <Icon
                    color="var(--ads-v2-color-fg-error)"
                    name="close-line"
                    size="sm"
                  />
                  <Text
                    kind="body-s"
                    style={{ color: "var(--ads-v2-color-fg-error)" }}
                  >
                    {GENERAL_SETTINGS_APP_URL_UNAVAILABLE_MESSAGE()}
                  </Text>
                </>
              )}
            </div>
          )}
          {shouldShowUrl && (
            <>
              <div className="pt-1">
                <UrlPreview className="mb-1" onCopy={handleUrlCopy}>
                  <AppUrlContent />
                </UrlPreview>
              </div>
              <div className="mt-1">
                <Text
                  kind="body-s"
                  style={{ color: "var(--ads-v2-color-fg-warning)" }}
                >
                  {GENERAL_SETTINGS_APP_URL_WARNING_MESSAGE()}
                </Text>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default GeneralSettings;
