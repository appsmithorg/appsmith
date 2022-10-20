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
  URL_FIELD_SPECIAL_CHARACTER_ERROR,
} from "ce/constants/messages";
import { Page } from "ce/constants/ReduxActionConstants";
import { Colors } from "constants/Colors";
import { TextInput } from "design-system";
import AdsSwitch from "design-system/build/Switch";
import ManualUpgrades from "pages/Editor/BottomBar/ManualUpgrades";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  selectApplicationVersion,
} from "selectors/editorSelectors";
import { getUpdatingEntity } from "selectors/explorerSelector";
import { getPageLoadingState } from "selectors/pageListSelectors";
import styled from "styled-components";
import { checkRegex } from "utils/validation/CheckRegex";
import TextLoaderIcon from "../Components/TextLoaderIcon";
import { getUrlPreview, specialCharacterCheckRegex } from "../Utils";

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

const UrlPreviewScroll = styled.p`
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

function PageSettings(props: { page: Page }) {
  const dispatch = useDispatch();
  const page = props.page;
  const applicationId = useSelector(getCurrentApplicationId);
  const applicationVersion = useSelector(selectApplicationVersion);
  const isPageLoading = useSelector(getPageLoadingState(page.pageId));

  const updatingEntity = useSelector(getUpdatingEntity);
  const isUpdatingEntity = updatingEntity === page.pageId;

  const appNeedsUpdate = applicationVersion < ApplicationVersion.SLUG_URL;

  const [pageName, setPageName] = useState(page.pageName);
  const [isPageNameSaving, setIsPageNameSaving] = useState(false);
  const [isPageNameValid, setIsPageNameValid] = useState(true);

  const [customSlug, setCustomSlug] = useState(page.customSlug);
  const [isCustomSlugValid, setIsCustomSlugValid] = useState(true);
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

  useEffect(() => {
    setPageName(page.pageName);
    setCustomSlug(page.customSlug || "");
    setIsShown(!!!page.isHidden);
    setIsDefault(!!page.isDefault);
  }, [page, page.pageName, page.customSlug, page.isHidden, page.isDefault]);

  useEffect(() => {
    if (!isPageLoading) {
      isPageNameSaving && setIsPageNameSaving(false);
      isCustomSlugSaving && setIsCustomSlugSaving(false);
      isShownSaving && setIsShownSaving(false);
    }
  }, [isPageLoading]);

  useEffect(() => {
    console.log(isUpdatingEntity);
    if (!isUpdatingEntity) {
      isDefaultSaving && setIsDefaultSaving(false);
    }
  }, [isUpdatingEntity]);

  const savePageName = useCallback(() => {
    if (!isPageNameValid || page.pageName === pageName) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      name: pageName,
    };
    setIsPageNameSaving(true);
    dispatch(updatePage(payload));
  }, [page.pageId, page.pageName, pageName, isPageNameValid]);

  const saveCustomSlug = useCallback(() => {
    if (!isCustomSlugValid || page.customSlug === customSlug) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      customSlug: customSlug || "",
    };
    setIsCustomSlugSaving(true);
    dispatch(updatePage(payload));
  }, [page.pageId, page.customSlug, customSlug, isCustomSlugValid]);

  const saveIsShown = useCallback(
    (isShown: boolean) => {
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
      <div className={`pb-1 text-[${Colors.GRAY_700.toLowerCase()}]`}>
        {PAGE_SETTINGS_PAGE_NAME_LABEL()}
      </div>
      <div className="pb-2.5 relative">
        {isPageNameSaving && <TextLoaderIcon />}
        <TextInput
          fill
          onBlur={savePageName}
          onChange={setPageName}
          onKeyPress={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              savePageName();
            }
          }}
          placeholder="Page name"
          type="input"
          validator={checkRegex(
            specialCharacterCheckRegex,
            URL_FIELD_SPECIAL_CHARACTER_ERROR(),
            true,
            setIsPageNameValid,
          )}
          value={pageName}
        />
      </div>

      <div className={`pb-1 text-[${Colors.GRAY_700.toLowerCase()}]`}>
        {PAGE_SETTINGS_PAGE_URL_LABEL()}
      </div>
      {appNeedsUpdate && (
        <div className={`pb-1 text-[${Colors.GRAY_700.toLowerCase()}]`}>
          {PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_1()}{" "}
          <ManualUpgrades inline>
            <a>
              <u>{PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_2()}</u>
            </a>
          </ManualUpgrades>{" "}
          {PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_3()}
        </div>
      )}
      <div className="pb-1 relative">
        {isCustomSlugSaving && <TextLoaderIcon />}
        <TextInput
          fill
          onBlur={saveCustomSlug}
          onChange={setCustomSlug}
          onKeyPress={(ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
              saveCustomSlug();
            }
          }}
          placeholder="Page URL"
          readOnly={appNeedsUpdate}
          type="input"
          validator={checkRegex(
            specialCharacterCheckRegex,
            URL_FIELD_SPECIAL_CHARACTER_ERROR(),
            false,
            setIsCustomSlugValid,
          )}
          value={customSlug}
        />
      </div>

      <UrlPreviewWrapper className={`pb-2 bg-[#f1f1f1]`}>
        <UrlPreviewScroll
          className={`py-1 pl-2 mr-0.5 text-[${Colors.GRAY_700.toLowerCase()}] text-xs leading-extra-tight break-all`}
        >
          {location.protocol}
          {"//"}
          {window.location.hostname}
          {Array.isArray(pathPreview) && (
            <>
              {pathPreview[0]}
              <strong className={`text-[${Colors.GRAY_800.toLowerCase()}]`}>
                {pathPreview[1]}
              </strong>
              {pathPreview[2]}
              {pathPreview[3]}
            </>
          )}
          {!Array.isArray(pathPreview) && pathPreview}
        </UrlPreviewScroll>
      </UrlPreviewWrapper>

      <div className="pb-2 flex justify-between content-center">
        <div className={`text-[${Colors.GRAY_700.toLowerCase()}]`}>
          {PAGE_SETTINGS_SHOW_PAGE_NAV()}
        </div>
        <SwitchWrapper>
          <AdsSwitch
            checked={isShown}
            className="mb-0"
            disabled={isShownSaving}
            large
            onChange={() => {
              setIsShown(!isShown);
              saveIsShown(!isShown);
            }}
          />
        </SwitchWrapper>
      </div>

      <div className="pb-4 flex justify-between content-center">
        <div className={`text-[${Colors.GRAY_700.toLowerCase()}]`}>
          {PAGE_SETTINGS_SET_AS_HOMEPAGE()}
        </div>
        <SwitchWrapper>
          <AdsSwitch
            checked={isDefault}
            className="mb-0"
            disabled={isDefaultSaving || page.isDefault}
            large
            onChange={() => {
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
