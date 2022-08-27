import { updateApplication } from "actions/applicationActions";
import classNames from "classnames";
import { IconSelector } from "components/ads";
import { AppIconName, Button, Size, TextInput } from "design-system";
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
    max-height: 110px;
    padding: 0;
    .t--icon-selected,
    .t--icon-not-selected {
      margin: 0;
    }
    gap: 8px;
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

  const isEdited =
    applicationName !== application?.name ||
    applicationIcon !== application?.icon;

  const updateAppSettings = () => {
    dispatch(
      updateApplication(applicationId, {
        icon: applicationIcon,
        name: applicationName,
        currentApp: true,
      }),
    );
  };
  return (
    <div className="mx-4">
      <HeaderText className="leading-[3rem] font-medium">
        General settings
      </HeaderText>

      <div className="pb-1 text-[#575757]">App name</div>
      <div className="pb-2.5">
        <TextInput
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
      <IconSelectorWrapper>
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
          "pt-1": true,
          "!bg-[#b3b3b3] !border-[#b3b3b3] !text-white": !isEdited,
          "!bg-[#393939] !border-[#393939] !text-white": isEdited,
        })}
        disabled={!isEdited}
        fill
        onClick={updateAppSettings}
        size={Size.medium}
        text="Save"
      />
    </div>
  );
}

export default GeneralSettings;
