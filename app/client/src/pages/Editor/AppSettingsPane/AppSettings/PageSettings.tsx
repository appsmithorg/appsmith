import { ApplicationVersion } from "actions/applicationActions";
import { setPageAsDefault, updatePage } from "actions/pageActions";
import { UpdatePageRequest } from "api/PageApi";
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
    setCustomSlug(page.customSlug);
    setIsHidden(page.isHidden);
    setIsDefault(page.isDefault);
  }, [page]);

  const savePageName = useCallback(() => {
    if (!isPageNameValid) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      name: pageName,
    };
    dispatch(updatePage(payload));
  }, [pageName]);

  const saveCustomSlug = useCallback(() => {
    if (!isCustomSlugValid) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      customSlug: customSlug || "",
    };
    dispatch(updatePage(payload));
  }, [customSlug]);

  const saveIsHidden = useCallback(
    (isHidden: boolean) => {
      const payload: UpdatePageRequest = {
        id: page.pageId,
        isHidden,
      };
      dispatch(updatePage(payload));
    },
    [isHidden],
  );

  return (
    <>
      <div className="pb-1 text-[#575757]">Page name</div>
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
            "No special characters allowed (except -)",
            true,
            setIsPageNameValid,
          )}
          value={pageName}
        />
      </div>

      <div className="pb-1 text-[#575757]">Change Page URL</div>
      {appNeedsUpdate && (
        <div className="pb-1 text-[#575757]">
          Please{" "}
          <ManualUpgrades inline>
            <a>
              <u>update</u>
            </a>
          </ManualUpgrades>{" "}
          your app URL to new readable format to change this*
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
            "No special characters allowed (except -)",
            false,
            setIsCustomSlugValid,
          )}
          value={customSlug}
        />
      </div>

      <div className="bg-[#e7e7e7] pb-2 break-all">
        <p className="p-2">
          {window.location.hostname}
          {Array.isArray(pathPreview) && (
            <>
              {pathPreview[0]}
              <strong>{pathPreview[1]}</strong>
              {pathPreview[2]}
              {pathPreview[3]}
            </>
          )}
          {!Array.isArray(pathPreview) && pathPreview}
        </p>
      </div>

      <div className="pb-2 flex justify-between content-center">
        <div className="text-[#575757]">Hide the page</div>
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
          <div className="text-[#575757]">Set as home page</div>
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
