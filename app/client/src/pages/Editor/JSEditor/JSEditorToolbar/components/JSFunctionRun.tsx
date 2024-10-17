import React, { useCallback } from "react";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { JSFunctionRun as OldJSFunctionRun } from "./old/JSFunctionRun";
import type { JSCollection } from "entities/JSCollection";
import {
  Button,
  Flex,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
} from "@appsmith/ads";
import type { JSActionDropdownOption } from "../../utils";
import { RUN_BUTTON_DEFAULTS, testLocators } from "../../constants";
import { createMessage, NO_JS_FUNCTION_TO_RUN } from "ee/constants/messages";

interface Props {
  disabled: boolean;
  isLoading: boolean;
  jsCollection: JSCollection;
  onButtonClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onSelect: (value: string | undefined) => void;
  options: JSActionDropdownOption[];
  selected: JSActionDropdownOption;
  showTooltip: boolean;
}

/**
 * JSFunctionRun component renders a button and a dropdown menu for running JS functions.
 * It conditionally renders the old or new version of the component based on a feature flag.
 *
 */
export const JSFunctionRun = (props: Props) => {
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  // Callback function to handle function selection from the dropdown menu
  const onFunctionSelect = useCallback((option: JSActionDropdownOption) => {
    if (props.onSelect) {
      props.onSelect(option.value);
    }
  }, []);

  if (!isActionRedesignEnabled) {
    return <OldJSFunctionRun {...props} />;
  }

  // Render the new version of the component
  return (
    <Flex gap="spaces-2">
      <Menu>
        <MenuTrigger>
          <Button
            endIcon="arrow-down-s-line"
            isDisabled={props.disabled}
            kind="tertiary"
            size="sm"
            startIcon=""
          >
            {props.selected.label}
          </Button>
        </MenuTrigger>
        <MenuContent align="end">
          {props.options.map((option) => (
            <MenuItem
              key={option.label}
              onSelect={() => onFunctionSelect(option)}
              size="sm"
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>

      <Tooltip
        content={createMessage(NO_JS_FUNCTION_TO_RUN, props.jsCollection.name)}
        isDisabled={!props.showTooltip}
        placement="topRight"
      >
        <Button
          className={testLocators.runJSAction}
          isDisabled={props.disabled}
          isLoading={props.isLoading}
          onClick={props.onButtonClick}
          size="sm"
        >
          {RUN_BUTTON_DEFAULTS.CTA_TEXT}
        </Button>
      </Tooltip>
    </Flex>
  );
};
