import React from "react";
import { InfoBlock, InfoBlockProps } from "./InfoBlock";
import {
  BannerMessage,
  Button,
  Category,
  Dropdown,
  DropdownOption,
  Icon,
  IconSize,
  Size,
  Spinner,
} from "design-system-old";
import { Colors } from "constants/Colors";
import {
  ConversionCompleteLayout,
  ConversionCompleteLayoutProps,
} from "./ConversionCompleteLayout";

type ConversionFormProps = {
  onCancel: () => void;
};

export type ConversionProps = {
  bannerMessageDetails?: {
    message: string;
    backgroundColor: string;
    iconName: string;
    iconColor: string;
    textColor: string;
  };
  cancelButtonText?: string;
  infoBlocks?: InfoBlockProps[];
  spinner?: string;
  primaryButton?: { text: string; onClick: () => void };
  secondaryButton?: { text: string; onClick: () => void };
  conversionComplete?: ConversionCompleteLayoutProps;
  selectDropDown?: {
    selected: DropdownOption;
    onSelect: (value: string, option: DropdownOption) => void;
    options: DropdownOption[];
    labelText: string;
  };
  snapShotDetails?: {
    labelText?: string;
    icon: string;
    text: string;
  };
};

export function ConversionForm<T>(
  conversionHook: (onCancel: () => void, hookProps?: T) => ConversionProps,
  hookProps?: T,
) {
  return (props: ConversionFormProps) => {
    const {
      bannerMessageDetails,
      cancelButtonText,
      conversionComplete,
      infoBlocks,
      primaryButton,
      secondaryButton,
      selectDropDown,
      snapShotDetails,
      spinner,
    } = conversionHook(props.onCancel, hookProps);
    return (
      <>
        {bannerMessageDetails && (
          <BannerMessage
            backgroundColor={bannerMessageDetails.backgroundColor}
            fontWeight="600"
            icon={bannerMessageDetails.iconName}
            iconColor={bannerMessageDetails.iconColor}
            iconFlexPosition="start"
            iconSize={IconSize.XXXL}
            intentLine
            message={bannerMessageDetails.message}
            textColor={bannerMessageDetails.textColor}
          />
        )}

        {infoBlocks &&
          infoBlocks.length > 0 &&
          infoBlocks.map((infoBlock: InfoBlockProps, index: number) => (
            <InfoBlock
              header={infoBlock.header}
              icon={infoBlock.icon}
              info={infoBlock.info}
              key={index}
            />
          ))}

        {spinner && (
          <div className="flex flex-col items-center py-12">
            <Spinner size={IconSize.XXXXL} />
            <p className="pt-4 text-base">{spinner}</p>
          </div>
        )}
        {conversionComplete && (
          <ConversionCompleteLayout {...conversionComplete} />
        )}
        {selectDropDown && (
          <>
            <p className="pt-4 pb-1 text-sm font-normal">
              {selectDropDown.labelText}
            </p>
            <Dropdown
              onSelect={selectDropDown.onSelect}
              options={selectDropDown.options}
              selected={selectDropDown.selected}
              showLabelOnly
            />
          </>
        )}

        {snapShotDetails && (
          <>
            {snapShotDetails.labelText && (
              <p className="pt-6 pb-1 text-base font-normal">
                {snapShotDetails.labelText}
              </p>
            )}
            <div
              className="h-14 flex flex-row border border-gray-200 items-center"
              style={snapShotDetails.labelText ? {} : { marginTop: "24px" }}
            >
              <Icon
                className="mx-3"
                fillColor={Colors.GRAY_600}
                name={snapShotDetails.icon}
                size={IconSize.XXXXL}
                withWrapper
                wrapperColor={Colors.GRAY_600_OPAQUE}
              />
              <p className="text-base font-medium">{snapShotDetails.text}</p>
            </div>
          </>
        )}
        <div className="flex flex-row pt-6 justify-between align-">
          {cancelButtonText ? (
            <Button
              category={Category.tertiary}
              className="t--convert-cancel-button"
              onClick={props.onCancel}
              size={Size.large}
              tag="button"
              text={cancelButtonText}
            />
          ) : (
            <div />
          )}
          <div className="flex flex-row justify-items-end gap-6">
            {secondaryButton && (
              <Button
                category={Category.secondary}
                onClick={secondaryButton.onClick}
                size={Size.large}
                tag="button"
                text={secondaryButton.text}
              />
            )}
            {primaryButton && (
              <Button
                category={Category.primary}
                onClick={primaryButton.onClick}
                size={Size.large}
                tag="button"
                text={primaryButton.text}
              />
            )}
          </div>
        </div>
      </>
    );
  };
}
