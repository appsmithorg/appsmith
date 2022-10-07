import { updateApplication } from "actions/applicationActions";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import { AppIconName, TextInput, IconSelector } from "design-system";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import styled from "styled-components";

const IconSelectorWrapper = styled.div`
  position: relative;
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

  const updateAppSettings = useCallback(
    debounce((icon?: AppIconName) => {
      const isAppNameUpdated = applicationName !== application?.name;

      const payload: UpdateApplicationPayload = { currentApp: true };
      if (isAppNameUpdated) {
        payload.name = applicationName;
      }
      icon ? (payload.icon = icon) : null;

      (isAppNameUpdated || icon) &&
        dispatch(updateApplication(applicationId, payload));
    }, 50),
    [applicationName, application, applicationId],
  );

  return (
    <>
      <div className="pb-1 text-[#575757]">App name</div>
      <div className="pb-2.5">
        <TextInput
          fill
          onBlur={() => updateAppSettings()}
          onChange={(name: string) => {
            setApplicationName(name);
          }}
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
          onSelect={(icon: AppIconName) => {
            setApplicationIcon(icon);
            // updateAppSettings - passing `icon` because `applicationIcon`
            // will be not updated untill the component is re-rendered
            updateAppSettings(icon);
          }}
          selectedColor="black"
          selectedIcon={applicationIcon}
        />
      </IconSelectorWrapper>
    </>
  );
}

export default GeneralSettings;
