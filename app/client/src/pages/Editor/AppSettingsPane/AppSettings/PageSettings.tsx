import { setPageSlug, updatePage } from "actions/pageActions";
import { UpdatePageRequest } from "api/PageApi";
import { Page } from "ce/constants/ReduxActionConstants";
import classNames from "classnames";
import { Button, Size, TextInput } from "design-system";
import AdsSwitch from "design-system/build/Switch";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

function PageSettings(props: { page: Page }) {
  const dispatch = useDispatch();
  const page = props.page;
  const [pageName, setPageName] = useState(page.pageName);
  const [customSlug, setCustomSlug] = useState(page.customSlug);
  const [isHidden, setIsHidden] = useState(page.isHidden);
  const [isDefault, setIsDefault] = useState(page.isDefault);

  const isPageNameUpdated = pageName !== page.pageName;
  const isPageUrlUpdated = customSlug !== page.customSlug;
  const isHiddenUpdated = isHidden !== page.isHidden;
  const isDefaultUpdated = isDefault !== page.isDefault;

  const isEdited =
    isPageNameUpdated ||
    isPageUrlUpdated ||
    isHiddenUpdated ||
    isDefaultUpdated;

  const saveChanges = () => {
    if (isPageUrlUpdated) {
      const payload: UpdatePageRequest = {
        id: page.pageId,
        customSlug: customSlug || "",
      };
      if (isPageNameUpdated) payload.name = pageName;
      if (isHiddenUpdated) payload.isHidden = !!isHidden;
      dispatch(setPageSlug(payload));
    } else {
      dispatch(updatePage(page.pageId, pageName, !!isHidden));
    }
  };

  return (
    <>
      <div className="pb-1 text-[#575757]">App name</div>
      <div className="pb-1">
        <TextInput
          fill
          onChange={setPageName}
          placeholder="Page name"
          type="input"
          validator={(value: string) => {
            return {
              isValid: value.length > 0,
              message: value.length > 0 ? "" : "Cannot be empty",
            };
          }}
          value={pageName}
        />
      </div>

      <div className="pb-1 text-[#575757]">Change Page URL</div>
      <div className="pb-2">
        <TextInput
          fill
          onChange={setCustomSlug}
          placeholder="Page URL"
          type="input"
          value={customSlug}
        />
      </div>

      <div className="pb-2 flex justify-between content-center">
        <div>Hide the page</div>
        <AdsSwitch
          checked={isHidden}
          className="mb-0"
          large
          onChange={() => setIsHidden(!isHidden)}
        />
      </div>

      <div className="pb-4 flex justify-between content-center">
        <div>Set as home page</div>
        <AdsSwitch
          checked={isDefault}
          className="mb-0"
          large
          onChange={() => setIsDefault(!isDefault)}
        />
      </div>

      <Button
        className={classNames({
          "!bg-[#b3b3b3] !border-[#b3b3b3] !text-white": !isEdited,
          "!bg-[#393939] !border-[#393939] !text-white": isEdited,
        })}
        disabled={!isEdited}
        fill
        onClick={saveChanges}
        size={Size.medium}
        text="Save"
      />
    </>
  );
}

export default PageSettings;
