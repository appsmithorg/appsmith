import React, { useCallback } from "react";
import type { AppTheme } from "entities/AppTheming";
import { TooltipComponent } from "design-system-old";
import CloseLineIcon from "remixicon-react/CloseLineIcon";
import { invertedBoxShadowOptions } from "constants/ThemeConstants";
import { SegmentedControl } from "design-system";

interface ThemeBoxShadowControlProps {
  options: {
    [key: string]: string;
  };
  selectedOption?: string;
  theme: AppTheme;
  sectionName: string;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeBoxShadowControl(props: ThemeBoxShadowControlProps) {
  const { options, sectionName, selectedOption, theme, updateTheme } = props;

  /**
   * changes the shadow in the theme
   */
  const onChangeShadow = useCallback(
    (optionKey: string) => {
      updateTheme({
        ...theme,
        properties: {
          ...theme.properties,
          boxShadow: {
            ...theme.properties.boxShadow,
            [sectionName]: options[optionKey],
          },
        },
      });
    },
    [updateTheme, theme],
  );

  const selectedOptionKey = selectedOption
    ? invertedBoxShadowOptions[selectedOption]
    : "";

  const buttonGroupOptions = Object.keys(options).map((optionKey) => ({
    label: (
      <TooltipComponent
        content={optionKey}
        key={optionKey}
        openOnTargetFocus={false}
      >
        <div
          className="flex items-center justify-center w-5 h-5 bg-white  t--theme-appBoxShadow"
          style={{ boxShadow: options[optionKey] }}
        >
          {options[optionKey] === "none" && (
            <CloseLineIcon className="text-gray-700" />
          )}
        </div>
      </TooltipComponent>
    ),
    value: optionKey,
  }));

  return (
    <SegmentedControl
      defaultValue={selectedOptionKey}
      isFullWidth={false}
      // @ts-expect-error: Type mismatch
      onChange={onChangeShadow}
      options={buttonGroupOptions}
    />
  );
}

export default ThemeBoxShadowControl;
