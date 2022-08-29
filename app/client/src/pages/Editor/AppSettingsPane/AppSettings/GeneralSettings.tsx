import { updateApplication } from "actions/applicationActions";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import classNames from "classnames";
import {
  AppIconName,
  Button,
  Size,
  TextInput,
  IconSelector,
} from "design-system";
import React, { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import styled from "styled-components";

const IconSelectorWrapper = styled.div`
  position: relative;
  // .t--icon-selected {
  //   background-color: #fff;
  //   svg {
  //     path {
  //       fill: #000;
  //     }
  //   }
  // }
  .icon-selector {
    max-height: 100px;
    padding: 0;
    .t--icon-selected,
    .t--icon-not-selected {
      margin: 0;
    }
    gap: 3px;
  }
  .icon-selector::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  .icon-selector::-webkit-scrollbar {
    width: 0px;
  }
`;

const HeaderText = styled.div`
  height: 48px;
`;

function GeneralSettings() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const application = useSelector(getCurrentApplication);

  const [applicationName, setApplicationName] = useState(application?.name);
  const [applicationIcon, setApplicationIcon] = useState(
    application?.icon as AppIconName,
  );

  useEffect(() => {
    setApplicationName(application?.name);
  }, [application?.name]);

  useEffect(() => {
    setApplicationIcon(application?.icon as AppIconName);
  }, [application?.icon]);

  const isAppNameUpdated = applicationName !== application?.name;
  const isAppIconUpdated = applicationIcon !== application?.icon;

  const isEdited = isAppNameUpdated || isAppIconUpdated;

  const updateAppSettings = () => {
    const payload: UpdateApplicationPayload = {};
    if (isAppNameUpdated) {
      payload.name = applicationName;
      payload.currentApp = true;
    }
    isAppIconUpdated ? (payload.icon = applicationIcon) : null;
    dispatch(updateApplication(applicationId, payload));
  };
  return (
    <>
      <HeaderText className="leading-[3rem] font-medium">
        General settings
      </HeaderText>

      <div className="pb-1 text-[#575757]">App name</div>
      <div className="pb-2.5">
        <TextInput
          fill
          onChange={setApplicationName}
          placeholder="App name"
          type="input"
          validator={(value: string) => {
            return {
              isValid: value.length > 0,
              message: value.length > 0 ? "" : "Cannot be empty",
            };
          }}
          value={applicationName}
        />
      </div>

      <div className="pb-1 text-[#575757]">App Icon</div>
      <IconSelectorWrapper className="pb-4">
        <IconSelector
          className="icon-selector"
          fill
          onSelect={setApplicationIcon}
          selectedColor="black"
          selectedIcon={applicationIcon}
        />
      </IconSelectorWrapper>

      <Button
        className={classNames({
          "!bg-[#b3b3b3] !border-[#b3b3b3] !text-white": !isEdited,
          "!bg-[#393939] !border-[#393939] !text-white": isEdited,
        })}
        disabled={!isEdited}
        fill
        onClick={updateAppSettings}
        size={Size.medium}
        text="Save"
      />
    </>
  );
}

export default GeneralSettings;
