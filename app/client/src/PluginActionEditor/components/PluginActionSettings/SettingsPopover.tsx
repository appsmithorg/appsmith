import React, { useCallback, useState } from "react";
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

export interface SettingsProps {
  formName: string;
}

const PluginActionSettingsPopover = (props: SettingsProps) => {
  const { settingsConfig } = usePluginActionContext();
  const [open, setOpen] = useState(false);
  const theme = EditorTheme.LIGHT;

  const onOpenChange = useCallback(
    (open) => {
      setOpen(open);
    },
    [open],
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
          Settings
        </PopoverHeader>
        <PopoverBody className={"!overflow-y-clip"}>
          <ActionSettings
            actionSettingsConfig={settingsConfig}
            formName={props.formName}
            theme={theme}
          />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default PluginActionSettingsPopover;
