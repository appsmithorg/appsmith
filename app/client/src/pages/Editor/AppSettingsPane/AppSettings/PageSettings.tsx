import { ApplicationVersion } from "actions/applicationActions";
import { setPageAsDefault, updatePage } from "actions/pageActions";
import { UpdatePageRequest } from "api/PageApi";
import {
  PAGE_SETTINGS_HIDE_PAGE_NAV,
  PAGE_SETTINGS_PAGE_NAME_LABEL,
  PAGE_SETTINGS_PAGE_URL_LABEL,
  PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_1,
  PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_2,
  PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_3,
  PAGE_SETTINGS_SET_AS_HOMEPAGE,
  URL_FIELD_SPECIAL_CHARACTER_ERROR,
} from "ce/constants/messages";
import { Page } from "ce/constants/ReduxActionConstants";
import { TextInput } from "design-system";
import AdsSwitch from "design-system/build/Switch";
import ManualUpgrades from "pages/Editor/BottomBar/ManualUpgrades";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  selectApplicationVersion,
} from "selectors/editorSelectors";
import { getPageLoadingState } from "selectors/pageListSelectors";
import { checkRegex } from "utils/validation/CheckRegex";
import { getUrlPreview } from "../Utils";

function PageSettings(props: { page: Page }) {
  const dispatch = useDispatch();
  const page = props.page;
  const applicationId = useSelector(getCurrentApplicationId);
  const applicationVersion = useSelector(selectApplicationVersion);
  const isPageLoading = useSelector(getPageLoadingState(page.pageId));

  const appNeedsUpdate = applicationVersion < ApplicationVersion.SLUG_URL;

  const [pageName, setPageName] = useState(page.pageName);
  const [isPageNameValid, setIsPageNameValid] = useState(true);
  const [customSlug, setCustomSlug] = useState(page.customSlug);
  const [isCustomSlugValid, setIsCustomSlugValid] = useState(true);
  const [isHidden, setIsHidden] = useState(page.isHidden);
  const [isDefault, setIsDefault] = useState(page.isDefault);

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
    setIsHidden(!!page.isHidden);
    setIsDefault(!!page.isDefault);
  }, [page, page.pageName, page.customSlug, page.isHidden, page.isDefault]);

  const savePageName = useCallback(() => {
    if (!isPageNameValid || page.pageName === pageName) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      name: pageName,
    };
    dispatch(updatePage(payload));
  }, [page.pageId, page.pageName, pageName, isPageNameValid]);

  const saveCustomSlug = useCallback(() => {
    if (!isCustomSlugValid || page.customSlug === customSlug) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      customSlug: customSlug || "",
    };
    dispatch(updatePage(payload));
  }, [page.pageId, page.customSlug, customSlug, isCustomSlugValid]);

  const saveIsHidden = useCallback(
    (isHidden: boolean) => {
      const payload: UpdatePageRequest = {
        id: page.pageId,
        isHidden,
      };
      dispatch(updatePage(payload));
    },
    [page.pageId, isHidden],
  );

  return (
    <>
      <div className="pb-1 text-[#575757]">
        {PAGE_SETTINGS_PAGE_NAME_LABEL()}
      </div>
      <div className="pb-2.5">
        <TextInput
          fill
          onBlur={savePageName}
          onChange={setPageName}
          placeholder="Page name"
          readOnly={isPageLoading}
          type="input"
          validator={checkRegex(
            /^[A-Za-z0-9\s\-]+$/,
            URL_FIELD_SPECIAL_CHARACTER_ERROR(),
            true,
            setIsPageNameValid,
          )}
          value={pageName}
        />
      </div>

      <div className="pb-1 text-[#575757]">
        {PAGE_SETTINGS_PAGE_URL_LABEL()}
      </div>
      {appNeedsUpdate && (
        <div className="pb-1 text-[#575757]">
          {PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_1()}{" "}
          <ManualUpgrades inline>
            <a>
              <u>{PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_2()}</u>
            </a>
          </ManualUpgrades>{" "}
          {PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_3()}
        </div>
      )}
      <div className="pb-2.5">
        <TextInput
          fill
          onBlur={saveCustomSlug}
          onChange={setCustomSlug}
          placeholder="Page URL"
          readOnly={appNeedsUpdate || isPageLoading}
          type="input"
          validator={checkRegex(
            /^[A-Za-z0-9\s\-]+$/,
            URL_FIELD_SPECIAL_CHARACTER_ERROR(),
            false,
            setIsCustomSlugValid,
          )}
          value={customSlug}
        />
      </div>

      <div className="pt-2 pb-2.5 text-[#575757] break-all">
        <p>
          {window.location.hostname}
          {Array.isArray(pathPreview) && (
            <>
              {pathPreview[0]}
              <strong className="text-[#393939]">{pathPreview[1]}</strong>
              {pathPreview[2]}
              {pathPreview[3]}
            </>
          )}
          {!Array.isArray(pathPreview) && pathPreview}
        </p>
      </div>

      <div className="pb-2 flex justify-between content-center">
        <div className="text-[#575757]">{PAGE_SETTINGS_HIDE_PAGE_NAV()}</div>
        <AdsSwitch
          checked={isHidden}
          className="mb-0"
          disabled={isPageLoading}
          large
          onChange={() => {
            setIsHidden(!isHidden);
            // saveIsHidden - passing `!isHidden` because it
            // will be not updated untill the component is re-rendered
            saveIsHidden(!isHidden);
          }}
        />
      </div>

      {!page.isDefault && (
        <div className="pb-4 flex justify-between content-center">
          <div className="text-[#575757]">
            {PAGE_SETTINGS_SET_AS_HOMEPAGE()}
          </div>
          <AdsSwitch
            checked={isDefault}
            className="mb-0"
            disabled={isPageLoading}
            large
            onChange={() => {
              setIsDefault(!isDefault);
              dispatch(setPageAsDefault(page.pageId, applicationId));
            }}
          />
        </div>
      )}
    </>
  );
}

export default PageSettings;
