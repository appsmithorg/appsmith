import { ApplicationVersion } from "actions/applicationActions";
import { setPageAsDefault, setPageSlug } from "actions/pageActions";
import { UpdatePageRequest } from "api/PageApi";
import { Page } from "ce/constants/ReduxActionConstants";
import { TextInput } from "design-system";
import AdsSwitch from "design-system/build/Switch";
import { APP_MODE } from "entities/App";
import urlBuilder from "entities/URLRedirect/URLAssembly";
import ManualUpgrades from "pages/Editor/BottomBar/ManualUpgrades";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  selectApplicationVersion,
} from "selectors/editorSelectors";
import { checkSpecialCharacters } from "../Utils/CheckSpecialCharacters";

function PageSettings(props: { page: Page }) {
  const dispatch = useDispatch();
  const page = props.page;
  const applicationId = useSelector(getCurrentApplicationId);
  const applicationVersion = useSelector(selectApplicationVersion);

  const appNeedsUpdate = applicationVersion < ApplicationVersion.SLUG_URL;

  const [pageName, setPageName] = useState(page.pageName);
  const [isPageNameValid, setIsPageNameValid] = useState(true);
  const [customSlug, setCustomSlug] = useState(page.customSlug);
  const [isCustomSlugValid, setIsCustomSlugValid] = useState(true);
  const [isHidden, setIsHidden] = useState(page.isHidden);
  const [isDefault, setIsDefault] = useState(page.isDefault);

  let pathPreview;

  // when page name is changed
  // and when custom slug doesn't exist
  if (!customSlug && pageName !== page.pageName) {
    // show path based on page name
    pathPreview = urlBuilder.getPagePathPreview(page.pageId, pageName);
  }
  // when custom slug is changed
  else if (customSlug !== page.customSlug) {
    if (customSlug) {
      // show custom slug preview
      pathPreview = urlBuilder.getCustomSlugPathPreview(
        page.pageId,
        customSlug,
      );
    } else {
      // when custom slug is removed
      // show path based on page name
      pathPreview = urlBuilder.getPagePathPreview(page.pageId, pageName);
    }
  }
  // when nothing has changed
  else {
    pathPreview = urlBuilder.generateBasePath(page.pageId, APP_MODE.PUBLISHED);
  }

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
    dispatch(setPageSlug(payload));
  }, [pageName]);

  const saveCustomSlug = useCallback(() => {
    if (!isCustomSlugValid) return;
    const payload: UpdatePageRequest = {
      id: page.pageId,
      customSlug: customSlug || "",
    };
    dispatch(setPageSlug(payload));
  }, [customSlug]);

  const saveIsHidden = (isHidden: boolean) => {
    const payload: UpdatePageRequest = {
      id: page.pageId,
      isHidden,
    };
    dispatch(setPageSlug(payload));
  };

  return (
    <>
      <div className="pb-1 text-[#575757]">Page name</div>
      <div className="pb-2.5">
        <TextInput
          fill
          onBlur={savePageName}
          onChange={setPageName}
          placeholder="Page name"
          type="input"
          validator={checkSpecialCharacters(true, setIsPageNameValid)}
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
          readOnly={appNeedsUpdate}
          type="input"
          validator={checkSpecialCharacters(false, setIsCustomSlugValid)}
          value={customSlug}
        />
      </div>

      <div className="bg-[#e7e7e7] pb-2 break-all">
        <p className="p-2">{window.location.hostname + pathPreview}</p>
      </div>

      <div className="pb-2 flex justify-between content-center">
        <div className="text-[#575757]">Hide the page</div>
        <AdsSwitch
          checked={isHidden}
          className="mb-0"
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
