import React, { useCallback, useEffect, useState } from "react";
import {
  Link,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  ToggleButton,
} from "@appsmith/ads";
import ActionSettings from "pages/Editor/ActionSettings";
import { usePluginActionContext } from "../../PluginActionContext";
import styled from "styled-components";
import {
  API_EDITOR_TAB_TITLES,
  createMessage,
  LEARN_MORE,
} from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  isPluginActionSettingsOpen,
  openPluginActionSettings,
} from "../../store";
import { THEME } from "../../constants";
import { type DocsLink, openDoc } from "constants/DocumentationLinks";

export interface SettingsProps {
  formName: string;
  docsLink?: DocsLink;
}

/* TODO: Remove this after removing custom width from server side (Ankita) */
const SettingsWrapper = styled.div`
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
      width: 100%;
    }
  }
`;

const StyledPopoverHeader = styled(PopoverHeader)`
  margin-bottom: var(--ads-v2-spaces-5);
`;

const LearnMoreLink = styled(Link)`
  span {
    font-weight: bold;
  }
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

  const handleLearnMoreClick = () => {
    openDoc(props.docsLink as DocsLink);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <PopoverTrigger>
        <ToggleButton
          icon="settings-2-line"
          isSelected={isOpen}
          onClick={handleButtonClick}
          size="md"
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
        <PopoverBody>
          <SettingsWrapper>
            <ActionSettings
              actionSettingsConfig={settingsConfig}
              formName={props.formName}
              theme={THEME}
            />
            {props.docsLink && (
              <LearnMoreLink
                className="t--action-settings-documentation-link"
                endIcon="share-box-line"
                kind="secondary"
                onClick={handleLearnMoreClick}
              >
                {createMessage(LEARN_MORE)}
              </LearnMoreLink>
            )}
          </SettingsWrapper>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default PluginActionSettingsPopover;
