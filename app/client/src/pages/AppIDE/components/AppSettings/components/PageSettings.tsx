import { ApplicationVersion } from "ee/actions/applicationActions";
import type { UpdatePageActionPayload } from "actions/pageActions";
import {
  setPageAsDefault,
  updatePageAction,
  persistPageSlug,
  validatePageSlug,
} from "actions/pageActions";
import {
  PAGE_SETTINGS_SHOW_PAGE_NAV,
  PAGE_SETTINGS_PAGE_NAME_LABEL,
  PAGE_SETTINGS_PAGE_URL_LABEL,
  PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_1,
  PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_2,
  PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_3,
  PAGE_SETTINGS_SET_AS_HOMEPAGE,
  PAGE_SETTINGS_SET_AS_HOMEPAGE_TOOLTIP,
  PAGE_SETTINGS_NAME_EMPTY_MESSAGE,
  PAGE_SETTINGS_SHOW_PAGE_NAV_TOOLTIP,
  PAGE_SETTINGS_SET_AS_HOMEPAGE_TOOLTIP_NON_HOME_PAGE,
  PAGE_SETTINGS_ACTION_NAME_CONFLICT_ERROR,
  PAGE_SETTINGS_PAGE_SLUG_CHECKING_MESSAGE,
  PAGE_SETTINGS_PAGE_SLUG_AVAILABLE_MESSAGE,
  PAGE_SETTINGS_PAGE_SLUG_UNAVAILABLE_MESSAGE,
  PAGE_SETTINGS_PAGE_SLUG_DEPLOY_MESSAGE,
  PAGE_SETTINGS_PAGE_NAME_CONFLICTING_SLUG_MESSAGE,
} from "ee/constants/messages";
import type { Page } from "entities/Page";
import classNames from "classnames";
import { Input, Switch, Text, Icon } from "@appsmith/ads";
import ManualUpgrades from "components/BottomBar/ManualUpgrades";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  selectApplicationVersion,
  getIsPersistingPageSlug,
  getIsValidatingPageSlug,
  getIsPageSlugValid,
  getPageList,
  getIsStaticUrlEnabled,
} from "selectors/editorSelectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { getUpdatingEntity } from "selectors/explorerSelector";
import { getPageLoadingState } from "selectors/pageListSelectors";
import TextLoaderIcon from "./TextLoaderIcon";
import UrlPreview from "./UrlPreview";
import { filterAccentedAndSpecialCharacters, getUrlPreview } from "../utils";
import type { DefaultRootState } from "react-redux";
import { getUsedActionNames } from "selectors/actionSelectors";
import { isNameValid, toValidPageName } from "utils/helpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

// Patterns for pageSlug and customSlug from routes: (.*\-) followed by ID
const PAGE_SLUG_WITH_MONGO_ID = /^.*\-[0-9a-f]{24}$/;
const PAGE_SLUG_WITH_UUID =
  /^.*\-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function PageSettings(props: { page: Page }) {
  const dispatch = useDispatch();
  const page = props.page;
  const applicationId = useSelector(getCurrentApplicationId);
  const applicationVersion = useSelector(selectApplicationVersion);
  const isPageLoading = useSelector(getPageLoadingState(page.pageId));
  const currentApplication = useSelector(getCurrentApplication);

  const updatingEntity = useSelector(getUpdatingEntity);
  const isUpdatingEntity = updatingEntity === page.pageId;

  const appNeedsUpdate = applicationVersion < ApplicationVersion.SLUG_URL;

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const isStaticUrlFeatureFlagEnabled = useFeatureFlag(
    FEATURE_FLAG.release_static_url_enabled,
  );
  const isStaticUrlEnabled =
    useSelector(getIsStaticUrlEnabled) && isStaticUrlFeatureFlagEnabled;

  const [canManagePages, setCanManagePages] = useState(
    getHasManagePagePermission(isFeatureEnabled, page?.userPermissions || []),
  );

  const [pageName, setPageName] = useState(page.pageName);
  const [isPageNameSaving, setIsPageNameSaving] = useState(false);
  const [pageNameError, setPageNameError] = useState<string | null>(null);

  const [customSlug, setCustomSlug] = useState(page.customSlug);
  const [isCustomSlugSaving, setIsCustomSlugSaving] = useState(false);

  const [staticPageSlug, setStaticPageSlug] = useState(page.uniqueSlug || "");
  const [staticPageSlugError, setStaticPageSlugError] = useState<string | null>(
    null,
  );
  const isStaticPageSlugSaving = useSelector((state) =>
    getIsPersistingPageSlug(state, page.pageId),
  );
  const isValidatingPageSlug = useSelector(getIsValidatingPageSlug);
  const isPageSlugValid = useSelector(getIsPageSlugValid);
  // TODO Will need to use the right selector pageWithMigratedDsl
  const pageList = useSelector(getPageList);

  const [isShown, setIsShown] = useState(!!!page.isHidden);
  const [isShownSaving, setIsShownSaving] = useState(false);

  const [isDefault, setIsDefault] = useState(page.isDefault);
  const [isDefaultSaving, setIsDefaultSaving] = useState(false);

  const pathPreview = useCallback(getUrlPreview, [
    page.pageId,
    pageName,
    page.pageName,
    currentApplication?.uniqueSlug,
    customSlug,
    page.customSlug,
    isStaticUrlEnabled,
    staticPageSlug,
    page.uniqueSlug || page.slug,
  ])(
    page.pageId,
    pageName,
    page.pageName,
    currentApplication?.uniqueSlug || "",
    customSlug,
    page.customSlug,
    isStaticUrlEnabled,
    staticPageSlug,
    page.uniqueSlug || page.slug,
  );

  const conflictingNames = useSelector(
    (state: DefaultRootState) => getUsedActionNames(state, ""),
    shallowEqual,
  );

  // Determine which validation message to show for page slug
  const pageSlugValidationMessage = useMemo(() => {
    // Only show messages if there's a slug and no error
    if (
      !staticPageSlug ||
      staticPageSlug.trim().length === 0 ||
      staticPageSlugError
    ) {
      return null;
    }

    // Get the deployed page slug from currentApplication.pages
    const deployedPageSlug = currentApplication?.pages?.find(
      (p) => p.id === page.pageId,
    )?.uniqueSlug;

    // Check if saved but not deployed
    const isSavedButNotDeployed =
      deployedPageSlug !== page.uniqueSlug &&
      staticPageSlug === page.uniqueSlug;

    // Check if edited and different from saved
    const isEditedAndDifferentFromSaved = staticPageSlug !== page.uniqueSlug;

    // If saved but not deployed, show deploy message
    if (isSavedButNotDeployed) {
      return {
        icon: "" as const,
        color: "var(--ads-v2-color-fg)",
        message: PAGE_SETTINGS_PAGE_SLUG_DEPLOY_MESSAGE(),
      };
    }

    // If edited and different from saved, show availability check
    if (isEditedAndDifferentFromSaved) {
      if (isValidatingPageSlug) {
        return {
          icon: "loader-line" as const,
          color: "var(--ads-v2-color-fg-muted)",
          message: PAGE_SETTINGS_PAGE_SLUG_CHECKING_MESSAGE(),
        };
      }

      if (isPageSlugValid) {
        return {
          icon: "check-line" as const,
          color: "var(--ads-v2-color-fg-success)",
          message: PAGE_SETTINGS_PAGE_SLUG_AVAILABLE_MESSAGE(),
        };
      }

      return {
        icon: "close-line" as const,
        color: "var(--ads-v2-color-fg-error)",
        message: PAGE_SETTINGS_PAGE_SLUG_UNAVAILABLE_MESSAGE(),
      };
    }

    return null;
  }, [
    staticPageSlug,
    staticPageSlugError,
    currentApplication?.pages,
    page.pageId,
    page.uniqueSlug,
    isValidatingPageSlug,
    isPageSlugValid,
  ]);

  const hasActionNameConflict = useCallback(
    (name: string) => !isNameValid(name, conflictingNames),
    [conflictingNames],
  );

  const validateStaticPageSlug = useCallback((value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return null; // Allow empty values
    }

    // Check if the value matches pageSlug with MongoDB Object ID pattern
    if (PAGE_SLUG_WITH_MONGO_ID.test(value)) {
      return "This slug is invalid. It matches a reserved pattern used by the system.";
    }

    // Check if the value matches pageSlug with UUID pattern
    if (PAGE_SLUG_WITH_UUID.test(value)) {
      return "This slug is invalid. It matches a reserved pattern used by the system.";
    }

    // Any other patterns are valid
    return null;
  }, []);

  useEffect(() => {
    setPageName(page.pageName);
    setCustomSlug(page.customSlug || "");
    setStaticPageSlug(page.uniqueSlug || "");
    setStaticPageSlugError(null); // Clear any validation errors
    setIsShown(!!!page.isHidden);
    setIsDefault(!!page.isDefault);
    setCanManagePages(
      getHasManagePagePermission(isFeatureEnabled, page?.userPermissions || []),
    );
  }, [
    page,
    page.pageName,
    page.customSlug,
    page.uniqueSlug,
    page.isHidden,
    page.isDefault,
  ]);

  useEffect(() => {
    if (!isPageLoading) {
      isPageNameSaving && setIsPageNameSaving(false);
      isCustomSlugSaving && setIsCustomSlugSaving(false);
      isShownSaving && setIsShownSaving(false);
    }
  }, [isPageLoading]);

  useEffect(() => {
    if (!isUpdatingEntity) {
      isDefaultSaving && setIsDefaultSaving(false);
    }
  }, [isUpdatingEntity]);

  useEffect(() => {
    setPageNameError(null);
  }, [page]);

  const savePageName = useCallback(() => {
    if (!canManagePages || pageNameError !== null || page.pageName === pageName)
      return;

    const payload: UpdatePageActionPayload = {
      id: page.pageId,
      name: pageName,
    };

    setIsPageNameSaving(true);
    dispatch(updatePageAction(payload));
  }, [page.pageId, page.pageName, pageName, pageNameError]);

  const saveCustomSlug = useCallback(() => {
    if (!canManagePages || page.customSlug === customSlug) return;

    const payload: UpdatePageActionPayload = {
      id: page.pageId,
      customSlug: customSlug || "",
    };

    setIsCustomSlugSaving(true);
    dispatch(updatePageAction(payload));
  }, [page.pageId, page.customSlug, customSlug]);

  const saveStaticPageSlug = useCallback(() => {
    if (!canManagePages || page.uniqueSlug === staticPageSlug) return;

    // Don't save if there's a validation error
    if (staticPageSlugError) return;

    // Don't save if the page slug is not valid
    if (!isPageSlugValid) return;

    dispatch(persistPageSlug(page.pageId, staticPageSlug || ""));
  }, [
    page.pageId,
    page.uniqueSlug,
    staticPageSlug,
    canManagePages,
    dispatch,
    staticPageSlugError,
    isPageSlugValid,
  ]);

  const saveIsShown = useCallback(
    (isShown: boolean) => {
      if (!canManagePages) return;

      const payload: UpdatePageActionPayload = {
        id: page.pageId,
        isHidden: !isShown,
      };

      setIsShownSaving(true);
      dispatch(updatePageAction(payload));
    },
    [page.pageId, isShown],
  );

  const checkPageNameSlugConflict = useCallback(
    (pageName: string): boolean => {
      const filteredValue = filterAccentedAndSpecialCharacters(pageName);

      // Check against existing pages for slug conflicts
      return pageList.some((existingPage) => {
        // Skip the current page
        if (existingPage.pageId === page.pageId) return false;

        // If the existing page has a uniqueSlug, check against it
        if (
          existingPage.uniqueSlug &&
          existingPage.uniqueSlug.trim().length > 0
        ) {
          return existingPage.uniqueSlug === filteredValue;
        }

        // If uniqueSlug is empty or not present, check against slug
        if (
          !existingPage.uniqueSlug ||
          existingPage.uniqueSlug.trim().length === 0
        ) {
          return existingPage.slug === filteredValue;
        }

        return false;
      });
    },
    [pageList, page.pageId],
  );

  const onPageNameChange = (value: string) => {
    let errorMessage = null;

    if (!value || value.trim().length === 0) {
      errorMessage = PAGE_SETTINGS_NAME_EMPTY_MESSAGE();
    } else if (value !== page.pageName && hasActionNameConflict(value)) {
      errorMessage = PAGE_SETTINGS_ACTION_NAME_CONFLICT_ERROR(value);
    } else if (value !== page.pageName && checkPageNameSlugConflict(value)) {
      errorMessage = PAGE_SETTINGS_PAGE_NAME_CONFLICTING_SLUG_MESSAGE();
    }

    setPageNameError(errorMessage);
    setPageName(toValidPageName(value));
  };

  const onPageSlugChange = (value: string) => {
    value.length > 0
      ? setCustomSlug(filterAccentedAndSpecialCharacters(value))
      : setCustomSlug(value);
  };

  const onStaticPageSlugChange = (value: string) => {
    const normalizedValue =
      value.length > 0 ? filterAccentedAndSpecialCharacters(value) : value;

    // Validate the normalized value
    const errorMessage = validateStaticPageSlug(normalizedValue);

    setStaticPageSlugError(errorMessage);

    // If no validation error, call the API to check availability
    if (!errorMessage && normalizedValue && normalizedValue.trim().length > 0) {
      dispatch(validatePageSlug(page.pageId, normalizedValue));
    }

    setStaticPageSlug(normalizedValue);
  };

  return (
    <>
      <div
        className={classNames({
          "pt-1 pb-2 relative": true,
          "pb-4": !pageNameError,
        })}
      >
        {isPageNameSaving && <TextLoaderIcon />}
        <Input
          defaultValue={pageName}
          errorMessage={pageNameError}
          id="t--page-settings-name"
          isDisabled={!canManagePages}
          label={PAGE_SETTINGS_PAGE_NAME_LABEL()}
          onBlur={savePageName}
          onChange={(value: string) => onPageNameChange(value)}
          onKeyPress={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              savePageName();
            }
          }}
          placeholder="Page name"
          size="md"
          type="text"
          value={pageName}
        />
      </div>

      {!isStaticUrlEnabled && appNeedsUpdate && (
        <div
          className={`pt-1 text-[color:var(--appsmith-color-black-700)] text-[13px]`}
          style={{ lineHeight: "1.31" }}
        >
          {PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_1()}{" "}
          <ManualUpgrades inline>
            <a>
              <u className="text-[color:var(--appsmith-color-black-900)]">
                {PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_2()}
              </u>
            </a>
          </ManualUpgrades>{" "}
          {PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_3()}
        </div>
      )}
      {!isStaticUrlEnabled && (
        <div
          className={classNames({
            "py-1 relative": true,
            "pb-2": appNeedsUpdate,
          })}
        >
          {isCustomSlugSaving && <TextLoaderIcon />}
          <Input
            defaultValue={customSlug}
            id="t--page-settings-custom-slug"
            isDisabled={!canManagePages}
            isReadOnly={appNeedsUpdate}
            label={PAGE_SETTINGS_PAGE_URL_LABEL()}
            onBlur={saveCustomSlug}
            onChange={(value: string) => onPageSlugChange(value)}
            onKeyPress={(ev: React.KeyboardEvent) => {
              if (ev.key === "Enter") {
                saveCustomSlug();
              }
            }}
            placeholder="Page URL"
            size="md"
            type="text"
            value={customSlug}
          />
        </div>
      )}

      {isStaticUrlEnabled && !appNeedsUpdate && (
        <div
          className={classNames({
            "py-1 relative": true,
            "pb-2": !staticPageSlugError,
          })}
        >
          {isStaticPageSlugSaving && <TextLoaderIcon />}
          <Input
            defaultValue={staticPageSlug}
            errorMessage={staticPageSlugError}
            id="t--page-settings-static-page-slug"
            isDisabled={!canManagePages}
            label="Page slug"
            onBlur={saveStaticPageSlug}
            onChange={(value: string) => onStaticPageSlugChange(value)}
            onKeyPress={(ev: React.KeyboardEvent) => {
              if (ev.key === "Enter") {
                saveStaticPageSlug();
              }
            }}
            placeholder="Page slug"
            size="md"
            type="text"
            value={staticPageSlug}
          />
          {pageSlugValidationMessage && (
            <div className="flex items-center gap-1 mt-1">
              <Icon
                color={pageSlugValidationMessage.color}
                name={pageSlugValidationMessage.icon}
                size="sm"
              />
              <Text
                kind="body-s"
                style={{ color: pageSlugValidationMessage.color }}
              >
                {pageSlugValidationMessage.message}
              </Text>
            </div>
          )}
        </div>
      )}

      {!appNeedsUpdate && (
        <UrlPreview
          className="mb-2"
          onCopy={async () => {
            navigator.clipboard.writeText(
              location.protocol +
                "//" +
                window.location.hostname +
                pathPreview.relativePath,
            );
          }}
        >
          {location.protocol}
          {"//"}
          {window.location.hostname}
          {Array.isArray(pathPreview.splitRelativePath) && (
            <>
              {pathPreview.splitRelativePath[0]}
              <strong
                className={`text-[color:var(--appsmith-color-black-800))]`}
              >
                {pathPreview.splitRelativePath[1]}
              </strong>
              {pathPreview.splitRelativePath[2]}
              {pathPreview.splitRelativePath[3]}
            </>
          )}
          {!Array.isArray(pathPreview.splitRelativePath) &&
            pathPreview.splitRelativePath}
        </UrlPreview>
      )}

      <div className="flex content-center justify-between pb-2">
        <Switch
          className="mb-0"
          id="t--page-settings-show-nav-control"
          isDisabled={isShownSaving || !canManagePages}
          isSelected={isShown}
          onChange={() => {
            setIsShown(!isShown);
            saveIsShown(!isShown);
          }}
        >
          <PropertyHelpLabel
            label={PAGE_SETTINGS_SHOW_PAGE_NAV()}
            lineHeight="1.17"
            maxWidth="217px"
            tooltip={PAGE_SETTINGS_SHOW_PAGE_NAV_TOOLTIP()}
          />
        </Switch>
      </div>

      <div className="flex content-center justify-between">
        <Switch
          className="mb-0"
          id="t--page-settings-home-page-control"
          isDisabled={isDefaultSaving || page.isDefault || !canManagePages}
          isSelected={isDefault}
          onChange={() => {
            if (!canManagePages) return;

            setIsDefault(!isDefault);
            setIsDefaultSaving(true);
            dispatch(setPageAsDefault(page.pageId, applicationId));
          }}
        >
          <PropertyHelpLabel
            label={PAGE_SETTINGS_SET_AS_HOMEPAGE()}
            lineHeight="1.17"
            maxWidth="217px"
            tooltip={
              !!isDefault
                ? PAGE_SETTINGS_SET_AS_HOMEPAGE_TOOLTIP()
                : PAGE_SETTINGS_SET_AS_HOMEPAGE_TOOLTIP_NON_HOME_PAGE()
            }
          />
        </Switch>
      </div>
    </>
  );
}

export default PageSettings;
