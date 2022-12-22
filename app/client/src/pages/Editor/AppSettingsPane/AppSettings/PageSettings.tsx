import { ApplicationVersion } from "actions/applicationActions";
import { setPageAsDefault, updatePage } from "actions/pageActions";
import { UpdatePageRequest } from "api/PageApi";
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
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { hasManagePagePermission } from "@appsmith/utils/permissionHelpers";
import classNames from "classnames";
import { Colors } from "constants/Colors";
import { Text, TextInput, TextType } from "design-system";
import AdsSwitch from "design-system/build/Switch";
import ManualUpgrades from "pages/Editor/BottomBar/ManualUpgrades";
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
import { getUrlPreview } from "../Utils";
import { AppState } from "@appsmith/reducers";
import { getUsedActionNames } from "selectors/actionSelectors";
import { isNameValid, resolveAsSpaceChar } from "utils/helpers";

const SwitchWrapper = styled.div`
  &&&&&&&
    .bp3-control.bp3-switch
    input:checked:disabled
    ~ .bp3-control-indicator {
    background: ${Colors.GREY_200};
  }

  .bp3-control.bp3-switch
    input:checked:disabled
    ~ .bp3-control-indicator::before {
    box-shadow: none;
  }
`;

const UrlPreviewWrapper = styled.div`
  height: 54px;
`;

const UrlPreviewScroll = styled.div`
  height: 48px;
  overflow-y: auto;

  /* width */
  ::-webkit-scrollbar {
    width: 3px;
  }
  /* Track */
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #bec4c4;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const specialCharacterCheckRegex = /^[A-Za-z0-9\s\-]+$/g;

function PageSettings(props: { page: Page }) {
  const dispatch = useDispatch();
  const page = props.page;
  const applicationId = useSelector(getCurrentApplicationId);
  const applicationVersion = useSelector(selectApplicationVersion);
  const isPageLoading = useSelector(getPageLoadingState(page.pageId));

  const updatingEntity = useSelector(getUpdatingEntity);
  const isUpdatingEntity = updatingEntity === page.pageId;

  const appNeedsUpdate = applicationVersion < ApplicationVersion.SLUG_URL;

  const [canManagePages, setCanManagePages] = useState(
    hasManagePagePermission(page?.userPermissions || []),
  );

  const [pageName, setPageName] = useState(page.pageName);
  const [isPageNameSaving, setIsPageNameSaving] = useState(false);
  const [isPageNameValid, setIsPageNameValid] = useState(true);

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
    setCanManagePages(hasManagePagePermission(page?.userPermissions || []));
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
    if (!canManagePages || !isPageNameValid || page.pageName === pageName)
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

  return (
    <>
      <Text type={TextType.P1}>{PAGE_SETTINGS_PAGE_NAME_LABEL()}</Text>
      <div
        className={classNames({
          "pt-1 pb-2 relative": true,
          "pb-4": !isPageNameValid,
        })}
      >
        {isPageNameSaving && <TextLoaderIcon />}
        <TextInput
          defaultValue={pageName}
          disabled={!canManagePages}
          fill
          id="t--page-settings-name"
          onBlur={savePageName}
          onChange={(value: string) =>
            setPageName(resolveAsSpaceChar(value, 30))
          }
          onKeyPress={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              savePageName();
            }
          }}
          placeholder="Page name"
          type="input"
          validator={(value: string) => {
            let result: { isValid: boolean; message?: string } = {
              isValid: true,
            };
            if (!value || value.trim().length === 0) {
              result = {
                isValid: false,
                message: PAGE_SETTINGS_NAME_EMPTY_MESSAGE(),
              };
            } else if (
              value !== page.pageName &&
              hasActionNameConflict(value)
            ) {
              result = {
                isValid: false,
                message: PAGE_SETTINGS_ACTION_NAME_CONFLICT_ERROR(value),
              };
            }
            setIsPageNameValid(result.isValid);
            return result;
          }}
          value={pageName}
        />
      </div>

      <Text type={TextType.P1}>{PAGE_SETTINGS_PAGE_URL_LABEL()}</Text>
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
        <TextInput
          defaultValue={customSlug}
          disabled={!canManagePages}
          fill
          id="t--page-settings-custom-slug"
          onBlur={saveCustomSlug}
          onChange={(value: string) =>
            value.length > 0
              ? specialCharacterCheckRegex.test(value) && setCustomSlug(value)
              : setCustomSlug(value)
          }
          onKeyPress={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              saveCustomSlug();
            }
          }}
          placeholder="Page URL"
          readOnly={appNeedsUpdate}
          type="input"
          value={customSlug}
        />
      </div>

      {!appNeedsUpdate && (
        <UrlPreviewWrapper
          className={`mb-2 bg-[color:var(--appsmith-color-black-100)]`}
        >
          <UrlPreviewScroll
            className={`py-1 pl-2 mr-0.5 text-[color:var(--appsmith-color-black-700)] text-xs break-all`}
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

      <div className="flex justify-between content-center pb-2">
        <div className="pt-0.5 text-[color:var(--appsmith-color-black-700)]">
          <PropertyHelpLabel
            label={PAGE_SETTINGS_SHOW_PAGE_NAV()}
            lineHeight="1.17"
            maxWidth="217px"
            tooltip={PAGE_SETTINGS_SHOW_PAGE_NAV_TOOLTIP()}
          />
        </div>
        <SwitchWrapper>
          <AdsSwitch
            checked={isShown}
            className="mb-0"
            disabled={isShownSaving || !canManagePages}
            id="t--page-settings-show-nav-control"
            large
            onChange={() => {
              setIsShown(!isShown);
              saveIsShown(!isShown);
            }}
          />
        </SwitchWrapper>
      </div>

      <div className="flex justify-between content-center">
        <div className="pt-0.5 text-[color:var(--appsmith-color-black-700)]">
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
        </div>
        <SwitchWrapper>
          <AdsSwitch
            checked={isDefault}
            className="mb-0"
            disabled={isDefaultSaving || page.isDefault || !canManagePages}
            id="t--page-settings-home-page-control"
            large
            onChange={() => {
              if (!canManagePages) return;
              setIsDefault(!isDefault);
              setIsDefaultSaving(true);
              dispatch(setPageAsDefault(page.pageId, applicationId));
            }}
          />
        </SwitchWrapper>
      </div>
    </>
  );
}

export default PageSettings;
