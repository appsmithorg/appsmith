import React from "react";
import type { InfoBlockProps } from "./InfoBlock";
import { InfoBlock } from "./InfoBlock";
import type { DropdownOption } from "design-system-old";
import {
  BannerMessage,
  Button,
  Category,
  Collapsible,
  Dropdown,
  Icon,
  IconSize,
  Size,
  Spinner,
  TextType,
  Text,
  Variant,
} from "design-system-old";
import { Colors } from "constants/Colors";
import type { ConversionCompleteLayoutProps } from "./ConversionCompleteLayout";
import { ConversionCompleteLayout } from "./ConversionCompleteLayout";

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
  primaryButton?: { text: string; onClick: () => void; variant?: Variant };
  secondaryButton?: { text: string; onClick: () => void };
  conversionComplete?: ConversionCompleteLayoutProps;
  collapsibleMessage?: {
    title: string;
    messageHeader: string;
    messagePoints: string[];
  };
  selectDropDown?: {
    selected: DropdownOption;
    onSelect: (value: string, option: DropdownOption) => void;
    options: DropdownOption[];
    labelText: string;
  };
  snapShotDetails?: {
    postText?: string;
    labelText?: string;
    icon: string;
    text: string;
  };
};

//This Conversion form renders conversion form flow based on props from conversionHook
export function ConversionForm<T>(
  conversionHook: (onCancel: () => void, hookProps?: T) => ConversionProps,
  hookProps?: T,
) {
  return (props: ConversionFormProps) => {
    const {
      bannerMessageDetails,
      cancelButtonText,
      collapsibleMessage,
      conversionComplete,
      infoBlocks,
      primaryButton,
      secondaryButton,
      selectDropDown,
      snapShotDetails,
      spinner,
    } = conversionHook(props.onCancel, hookProps);

    const snapShotStyles: React.CSSProperties = {};
    if (snapShotDetails) {
      if (!snapShotDetails.labelText) {
        snapShotStyles.marginTop = "24px";
      }

      if (!snapShotDetails.postText) {
        snapShotStyles.marginBottom = "16px";
      }
    }

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
          <div className="flex flex-col items-center py-11">
            <Spinner size={IconSize.XXXXL} />
            <Text className="pt-4" type={TextType.P0}>
              {spinner}
            </Text>
          </div>
        )}
        {conversionComplete && (
          <ConversionCompleteLayout {...conversionComplete} />
        )}
        {collapsibleMessage && (
          <Collapsible className="px-2" title={collapsibleMessage.title}>
            <Text color={Colors.GRAY_900} type={TextType.P1}>
              {collapsibleMessage.messageHeader}
            </Text>
            <ul className="text-sm text-gray-500 list-disc pl-4">
              {collapsibleMessage.messagePoints.map((text, id) => (
                <li key={id}>{text}</li>
              ))}
            </ul>
          </Collapsible>
        )}
        {selectDropDown && (
          <>
            <div className="pt-6 pb-1">
              <Text type={TextType.P1}>{selectDropDown.labelText}</Text>
            </div>
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
              <div className="pt-6 pb-2">
                <Text type={TextType.P0} weight={400}>
                  {snapShotDetails.labelText}
                </Text>
              </div>
            )}
            <div
              className="h-14 flex flex-row border border-gray-200 items-center"
              style={snapShotStyles}
            >
              <Icon
                className="mx-3"
                clickable={false}
                fillColor={Colors.GRAY_600}
                name={snapShotDetails.icon}
                size={IconSize.XXXL}
                withWrapper
                wrapperColor={Colors.GRAY_600_OPAQUE}
              />
              <Text type={TextType.H4}>{snapShotDetails.text}</Text>
            </div>
            {snapShotDetails.postText && (
              <div className="pt-2 mb-3">
                <Text type={TextType.P3} weight={400}>
                  {snapShotDetails.postText}
                </Text>
              </div>
            )}
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
                variant={primaryButton.variant || Variant.info}
              />
            )}
          </div>
        </div>
      </>
    );
  };
}
