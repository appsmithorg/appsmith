import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@appsmith/ads";
import ActionSettings from "pages/Editor/ActionSettings";
import { usePluginActionContext } from "../../PluginActionContext";
import styled from "styled-components";
import { API_EDITOR_TAB_TITLES, createMessage } from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  isPluginActionSettingsOpen,
  openPluginActionSettings,
} from "../../store";
import { THEME } from "../../constants";

export interface SettingsProps {
  formName: string;
}

/* TODO: Remove this after removing custom width from server side (Ankita) */
const SettingsWrapper = styled.div`
  overflow-y: scroll;
  max-height: calc(var(--popover-max-height) - 69px);

  .t--form-control-INPUT_TEXT,
  .t--form-control-DROP_DOWN {
    > div {
      min-width: unset;
      width: 100%;
    }
  }

  .form-config-top {
    .form-label {
      min-width: unset;
      width: 100%l;
    }
  }
`;

const StyledPopoverHeader = styled(PopoverHeader)`
  position: sticky;
  top: 0px;
`;

const StyledPopoverBody = styled(PopoverBody)`
  overflow-y: clip !important;
`;

const PluginActionSettingsPopover = (props: SettingsProps) => {
  const { settingsConfig } = usePluginActionContext();
  const openSettings = useSelector(isPluginActionSettingsOpen);
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (openSettings) {
      handleOpenChange(true);
    }
  }, [openSettings]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);

      if (openSettings && !open) {
        dispatch(openPluginActionSettings(false));
      }
    },
    [openSettings],
  );

  const handleEscapeKeyDown = () => {
    handleOpenChange(false);
  };

  const handleButtonClick = () => {
    handleOpenChange(true);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <PopoverTrigger>
        <Button
          isIconButton
          kind="secondary"
          onClick={handleButtonClick}
          size="sm"
          startIcon="settings-2-line"
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        onEscapeKeyDown={handleEscapeKeyDown}
        size="sm"
      >
        <StyledPopoverHeader isClosable>
          {createMessage(API_EDITOR_TAB_TITLES.SETTINGS)}
        </StyledPopoverHeader>
        <StyledPopoverBody className={"!overflow-y-clip"}>
          <SettingsWrapper>
            <ActionSettings
              actionSettingsConfig={settingsConfig}
              formName={props.formName}
              theme={THEME}
            />
          </SettingsWrapper>
        </StyledPopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default PluginActionSettingsPopover;
