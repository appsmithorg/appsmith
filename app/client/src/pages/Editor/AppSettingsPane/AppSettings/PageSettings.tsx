import { ApplicationVersion } from "@appsmith/actions/applicationActions";
import { setPageAsDefault, updatePage } from "actions/pageActions";
import type { UpdatePageRequest } from "api/PageApi";
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
} from "@appsmith/constants/messages";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import classNames from "classnames";
import { Input, Switch } from "design-system";
import ManualUpgrades from "components/BottomBar/ManualUpgrades";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import React, { useCallback, useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  selectApplicationVersion,
} from "selectors/editorSelectors";
import { getUpdatingEntity } from "selectors/explorerSelector";
import { getPageLoadingState } from "selectors/pageListSelectors";
import styled from "styled-components";
import TextLoaderIcon from "../Components/TextLoaderIcon";
import { filterAccentedAndSpecialCharacters, getUrlPreview } from "../Utils";
import type { AppState } from "@appsmith/reducers";
import { getUsedActionNames } from "selectors/actionSelectors";
import { isNameValid, resolveAsSpaceChar } from "utils/helpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasManagePagePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

const UrlPreviewWrapper = styled.div`
  height: 52px;
  color: var(--ads-v2-color-fg);
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-v2-color-bg-subtle);
  line-height: 1.17;
`;

const UrlPreviewScroll = styled.div`
  height: 48px;
  overflow-y: auto;
`;

function PageSettings(props: { page: Page }) {
  const dispatch = useDispatch();
  const page = props.page;
  const applicationId = useSelector(getCurrentApplicationId);
  const applicationVersion = useSelector(selectApplicationVersion);
  const isPageLoading = useSelector(getPageLoadingState(page.pageId));

  const updatingEntity = useSelector(getUpdatingEntity);
  const isUpdatingEntity = updatingEntity === page.pageId;

  const appNeedsUpdate = applicationVersion < ApplicationVersion.SLUG_URL;

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const [canManagePages, setCanManagePages] = useState(
    getHasManagePagePermission(isFeatureEnabled, page?.userPermissions || []),
  );

  const [pageName, setPageName] = useState(page.pageName);
  const [isPageNameSaving, setIsPageNameSaving] = useState(false);
  const [isPageNameValid, setIsPageNameValid] = useState<string | undefined>(
    undefined,
  );

  const [customSlug, setCustomSlug] = useState(page.customSlug);
  const [isCustomSlugSaving, setIsCustomSlugSaving] = useState(false);

  const [isShown, setIsShown] = useState(!!!page.isHidden);
  const [isShownSaving, setIsShownSaving] = useState(false);

  const [isDefault, setIsDefault] = useState(page.isDefault);
  const [isDefaultSaving, setIsDefaultSaving] = useState(false);

  const pathPreview = useCallback(getUrlPreview, [
    page.pageId,
    pageName,
    page.pageName,
    customSlug,
    page.customSlug,
  ])(page.pageId, pageName, page.pageName, customSlug, page.customSlug);

  const conflictingNames = useSelector(
    (state: AppState) => getUsedActionNames(state, ""),
    shallowEqual,
  );

  const hasActionNameConflict = useCallback(
    (name: string) => !isNameValid(name, conflictingNames),
    [conflictingNames],
  );

  useEffect(() => {
    setPageName(page.pageName);
    setCustomSlug(page.customSlug || "");
    setIsShown(!!!page.isHidden);
    setIsDefault(!!page.isDefault);
    setCanManagePages(
      getHasManagePagePermission(isFeatureEnabled, page?.userPermissions || []),
    );
  }, [page, page.pageName, page.customSlug, page.isHidden, page.isDefault]);

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

  const savePageName = useCallback(() => {
    if (!canManagePages || !!isPageNameValid || page.pageName === pageName)
      return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      name: pageName,
    };
    setIsPageNameSaving(true);
    dispatch(updatePage(payload));
  }, [page.pageId, page.pageName, pageName, isPageNameValid]);

  const saveCustomSlug = useCallback(() => {
    if (!canManagePages || page.customSlug === customSlug) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      customSlug: customSlug || "",
    };
    setIsCustomSlugSaving(true);
    dispatch(updatePage(payload));
  }, [page.pageId, page.customSlug, customSlug]);

  const saveIsShown = useCallback(
    (isShown: boolean) => {
      if (!canManagePages) return;
      const payload: UpdatePageRequest = {
        id: page.pageId,
        isHidden: !isShown,
      };
      setIsShownSaving(true);
      dispatch(updatePage(payload));
    },
    [page.pageId, isShown],
  );

  const onPageNameChange = (value: string) => {
    let isValid = undefined;
    if (!value || value.trim().length === 0) {
      isValid = PAGE_SETTINGS_NAME_EMPTY_MESSAGE();
    } else if (value !== page.pageName && hasActionNameConflict(value)) {
      isValid = PAGE_SETTINGS_ACTION_NAME_CONFLICT_ERROR(value);
    }

    setIsPageNameValid(isValid);
    setPageName(resolveAsSpaceChar(value, 30));
  };

  const onPageSlugChange = (value: string) => {
    value.length > 0
      ? setCustomSlug(filterAccentedAndSpecialCharacters(value))
      : setCustomSlug(value);
  };

  return (
    <>
      <div
        className={classNames({
          "pt-1 pb-2 relative": true,
          "pb-4": !isPageNameValid,
        })}
      >
        {isPageNameSaving && <TextLoaderIcon />}
        <Input
          defaultValue={pageName}
          errorMessage={isPageNameValid}
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

      {appNeedsUpdate && (
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

      {!appNeedsUpdate && (
        <UrlPreviewWrapper className="mb-2">
          <UrlPreviewScroll
            className="py-1 pl-2 mr-0.5 text-xs break-all"
            onCopy={() => {
              navigator.clipboard.writeText(
                location.protocol +
                  "//" +
                  window.location.hostname +
                  pathPreview.relativePath,
              );
            }}
            style={{ lineHeight: "1.17" }}
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
          </UrlPreviewScroll>
        </UrlPreviewWrapper>
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
