import {
  updateApplication,
  persistAppSlug,
  validateAppSlug,
  fetchAppSlugSuggestion,
  enableStaticUrl,
  disableStaticUrl,
} from "ee/actions/applicationActions";
import type { UpdateApplicationPayload } from "ee/api/ApplicationApi";
import {
  GENERAL_SETTINGS_APP_ICON_LABEL,
  GENERAL_SETTINGS_APP_NAME_LABEL,
  GENERAL_SETTINGS_NAME_EMPTY_MESSAGE,
  GENERAL_SETTINGS_APP_URL_LABEL,
  GENERAL_SETTINGS_APP_URL_INVALID_MESSAGE,
  GENERAL_SETTINGS_APP_URL_CHECKING_MESSAGE,
  GENERAL_SETTINGS_APP_URL_AVAILABLE_MESSAGE,
  GENERAL_SETTINGS_APP_URL_UNAVAILABLE_MESSAGE,
  GENERAL_SETTINGS_APP_URL_EMPTY_VALUE_MESSAGE,
  GENERAL_SETTINGS_APP_URL_PLACEHOLDER_FETCHING,
  GENERAL_SETTINGS_APP_URL_PLACEHOLDER,
  createMessage,
} from "ee/constants/messages";
import classNames from "classnames";
import type { AppIconName } from "@appsmith/ads-old";
import { Input, Switch, Text, Icon, Flex, Button } from "@appsmith/ads";
import { IconSelector } from "@appsmith/ads-old";
import React, { useCallback, useMemo, useState } from "react";
import { useEffect } from "react";
import StaticURLConfirmationModal from "./StaticURLConfirmationModal";
import { debounce } from "lodash";
import { useDispatch, useSelector } from "react-redux";

const APPLICATION_SLUG_REGEX = /^[a-z0-9-]+$/;

import {
  getCurrentApplication,
  getIsSavingAppName,
  getIsPersistingAppSlug,
  getIsValidatingAppSlug,
  getIsApplicationSlugValid,
  getIsFetchingAppSlugSuggestion,
  getAppSlugSuggestion,
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
  const isFetchingAppSlugSuggestion = useSelector(
    getIsFetchingAppSlugSuggestion,
  );
  const appSlugSuggestion = useSelector(getAppSlugSuggestion);
  const isAppSlugSaving = useSelector(getIsPersistingAppSlug);

  const [applicationName, setApplicationName] = useState(application?.name);
  const [isAppNameValid, setIsAppNameValid] = useState(true);
  const [applicationIcon, setApplicationIcon] = useState(
    application?.icon as AppIconName,
  );
  const [applicationSlug, setApplicationSlug] = useState(
    application?.uniqueSlug || "",
  );
  const [isClientSideSlugValid, setIsClientSideSlugValid] = useState(true);
  const [isStaticUrlToggleEnabled, setIsStaticUrlToggleEnabled] =
    useState(!!applicationSlug);
  const [
    isStaticUrlConfirmationModalOpen,
    setIsStaticUrlConfirmationModalOpen,
  ] = useState(false);
  const [modalType, setModalType] = useState<"change" | "disable">("change");
  const isStaticUrlFeatureEnabled = useFeatureFlag(
    FEATURE_FLAG.release_static_url_enabled,
  );

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

  useEffect(
    function updateApplicationSlugSuggestion() {
      if (appSlugSuggestion) {
        setApplicationSlug(appSlugSuggestion || "");
      }
    },
    [appSlugSuggestion],
  );

  const openStaticUrlConfirmationModal = useCallback(() => {
    setModalType("change");
    setIsStaticUrlConfirmationModalOpen(true);
  }, []);

  const closeStaticUrlConfirmationModal = useCallback(() => {
    setIsStaticUrlConfirmationModalOpen(false);

    // Reset toggle to original state if disabling
    if (modalType === "disable") {
      setIsStaticUrlToggleEnabled(true);
    }
  }, [modalType]);

  const confirmStaticUrlChange = useCallback(() => {
    const onSuccess = () => {
      setIsStaticUrlConfirmationModalOpen(false);
    };

    if (applicationSlug && applicationSlug !== application?.uniqueSlug) {
      if (!application?.staticUrlEnabled) {
        dispatch(enableStaticUrl(applicationSlug, onSuccess));
      } else {
        dispatch(persistAppSlug(applicationSlug, onSuccess));
      }
    } else {
      // If no change needed, just close the modal
      onSuccess();
    }
  }, [
    applicationSlug,
    application?.uniqueSlug,
    dispatch,
    application?.staticUrlEnabled,
  ]);

  const cancelSlugChange = useCallback(() => {
    setApplicationSlug(application?.uniqueSlug || "");
    setIsClientSideSlugValid(true);

    // Reset toggle to false if uniqueSlug is empty or not available
    if (!application?.uniqueSlug) {
      setIsStaticUrlToggleEnabled(false);
    }
  }, [application?.uniqueSlug]);

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
        const isValid = APPLICATION_SLUG_REGEX.test(normalizedValue);

        setIsClientSideSlugValid(isValid);

        if (isValid) {
          // Dispatch validation action instead of persisting
          dispatch(validateAppSlug(normalizedValue));
        }
      } else {
        setIsClientSideSlugValid(true);
      }

      setApplicationSlug(normalizedValue);
    },
    [dispatch],
  );

  const shouldShowUrl = applicationSlug && applicationSlug.trim().length > 0;
  const appUrl = `${window.location.origin}/app/${applicationSlug}`;
  const toUrlForDisable = application?.slug || "";

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
      if (!isEnabled && isStaticUrlToggleEnabled) {
        // Show confirmation modal when disabling
        setModalType("disable");
        setIsStaticUrlConfirmationModalOpen(true);
      } else if (isEnabled) {
        // Enable immediately
        setIsStaticUrlToggleEnabled(true);
        dispatch(fetchAppSlugSuggestion(applicationId));
      }
    },
    [dispatch, applicationId, isStaticUrlToggleEnabled],
  );

  const handleUrlCopy = useCallback(async () => {
    await navigator.clipboard.writeText(appUrl);
  }, [appUrl]);

  const confirmDisableStaticUrl = useCallback(() => {
    const onSuccess = () => {
      setIsStaticUrlToggleEnabled(false);
      setIsStaticUrlConfirmationModalOpen(false);
    };

    dispatch(disableStaticUrl(onSuccess));
  }, [dispatch]);

  const applicationSlugErrorMessage = useMemo(() => {
    if (isFetchingAppSlugSuggestion) return undefined;

    if (!applicationSlug || applicationSlug.trim().length === 0) {
      return createMessage(GENERAL_SETTINGS_APP_URL_EMPTY_VALUE_MESSAGE);
    }

    if (!isClientSideSlugValid) {
      return createMessage(GENERAL_SETTINGS_APP_URL_INVALID_MESSAGE);
    }

    return undefined;
  }, [
    isFetchingAppSlugSuggestion,
    applicationSlug,
    isClientSideSlugValid,
    isApplicationSlugValid,
  ]);

  const isApplicationSlugInputValid = useMemo(() => {
    if (isFetchingAppSlugSuggestion) return true;

    return (
      !!applicationSlug &&
      applicationSlug.trim().length > 0 &&
      isClientSideSlugValid &&
      isApplicationSlugValid
    );
  }, [
    isFetchingAppSlugSuggestion,
    applicationSlug,
    isClientSideSlugValid,
    isApplicationSlugValid,
  ]);

  const hasSlugChanged = useMemo(() => {
    return applicationSlug !== application?.uniqueSlug;
  }, [applicationSlug, application?.uniqueSlug]);

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
            isAppNameValid
              ? undefined
              : createMessage(GENERAL_SETTINGS_NAME_EMPTY_MESSAGE)
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

      <Text kind="action-m">
        {createMessage(GENERAL_SETTINGS_APP_ICON_LABEL)}
      </Text>
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
            "pt-2 pb-2 relative": true,
            "pb-4":
              !applicationSlug ||
              applicationSlug.trim().length === 0 ||
              !isApplicationSlugValid,
          })}
        >
          {isAppSlugSaving && <TextLoaderIcon />}
          <Input
            errorMessage={applicationSlugErrorMessage}
            id="t--general-settings-app-url"
            isDisabled={isFetchingAppSlugSuggestion}
            isValid={isApplicationSlugInputValid}
            label={createMessage(GENERAL_SETTINGS_APP_URL_LABEL)}
            onChange={onSlugChange}
            placeholder={
              isFetchingAppSlugSuggestion
                ? createMessage(GENERAL_SETTINGS_APP_URL_PLACEHOLDER_FETCHING)
                : createMessage(GENERAL_SETTINGS_APP_URL_PLACEHOLDER)
            }
            size="md"
            startIcon={isFetchingAppSlugSuggestion ? "loader-line" : undefined}
            type="text"
            value={applicationSlug}
          />
          {!isFetchingAppSlugSuggestion &&
            isClientSideSlugValid &&
            applicationSlug &&
            applicationSlug.trim().length > 0 &&
            applicationSlug !== application?.uniqueSlug && (
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
                      {createMessage(GENERAL_SETTINGS_APP_URL_CHECKING_MESSAGE)}
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
                      {createMessage(
                        GENERAL_SETTINGS_APP_URL_AVAILABLE_MESSAGE,
                      )}
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
                      {createMessage(
                        GENERAL_SETTINGS_APP_URL_UNAVAILABLE_MESSAGE,
                      )}
                    </Text>
                  </>
                )}
              </div>
            )}
          {!isFetchingAppSlugSuggestion &&
            isApplicationSlugInputValid &&
            shouldShowUrl && (
              <div className="pt-2">
                <UrlPreview className="mb-1" onCopy={handleUrlCopy}>
                  <AppUrlContent />
                </UrlPreview>
              </div>
            )}
          <Flex className="mt-2" gap="spaces-2" justifyContent="end">
            <Button
              data-testid="t--static-url-confirmation-cancel"
              kind="tertiary"
              onClick={cancelSlugChange}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              data-testid="t--static-url-confirmation-confirm"
              isDisabled={
                !hasSlugChanged ||
                isFetchingAppSlugSuggestion ||
                !isApplicationSlugInputValid ||
                !!applicationSlugErrorMessage ||
                isValidatingAppSlug
              }
              kind="secondary"
              onClick={openStaticUrlConfirmationModal}
              size="sm"
            >
              Apply
            </Button>
          </Flex>
        </div>
      )}

      <StaticURLConfirmationModal
        baseUrl={`${window.location.origin}/app/`}
        isDisabling={modalType === "disable"}
        isOpen={isStaticUrlConfirmationModalOpen}
        isSaving={isAppSlugSaving}
        newSlug={
          modalType === "disable" ? toUrlForDisable : applicationSlug || ""
        }
        oldSlug={application?.uniqueSlug || application?.slug || ""}
        onClose={closeStaticUrlConfirmationModal}
        onConfirm={
          modalType === "disable"
            ? confirmDisableStaticUrl
            : confirmStaticUrlChange
        }
      />
    </>
  );
}

export default GeneralSettings;
