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
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { usePluginActionContext } from "../../PluginActionContext";
import styled from "styled-components";
import { API_EDITOR_TAB_TITLES, createMessage } from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  isPluginActionSettingsOpen,
  openPluginActionSettings,
} from "../../store";

export interface SettingsProps {
  formName: string;
}

/* TODO: Remove this after removing custom width from server side (Ankita) */
const SettingsWrapper = styled.div`
  .t--form-control-INPUT_TEXT,
  .t--form-control-DROP_DOWN {
    > div {
      width: 100%;
    }
  }
`;

const PluginActionSettingsPopover = (props: SettingsProps) => {
  const { settingsConfig } = usePluginActionContext();
  const openSettings = useSelector(isPluginActionSettingsOpen);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const theme = EditorTheme.LIGHT;

  useEffect(() => {
    if (openSettings) {
      onOpenChange(true);
    }
  }, [openSettings]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);

      if (openSettings && !open) {
        dispatch(openPluginActionSettings(false));
      }
    },
    [openSettings],
  );

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger>
        <Button
          isIconButton
          kind="secondary"
          onClick={() => onOpenChange(true)}
          size="sm"
          startIcon="settings-2-line"
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        onEscapeKeyDown={() => onOpenChange(false)}
        size="md"
      >
        <PopoverHeader className="sticky top-0" isClosable>
          {createMessage(API_EDITOR_TAB_TITLES.SETTINGS)}
        </PopoverHeader>
        <PopoverBody className={"!overflow-y-clip"}>
          <SettingsWrapper>
            <ActionSettings
              actionSettingsConfig={settingsConfig}
              formName={props.formName}
              theme={theme}
            />
          </SettingsWrapper>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default PluginActionSettingsPopover;
