import React from "react";
import styled from "styled-components";
import type { InfoBlockProps } from "./InfoBlock";
import { InfoBlock } from "./InfoBlock";
import type { DropdownOption } from "design-system-old";
import { BannerMessage, Collapsible, IconSize } from "design-system-old";
import { Button, Select, Option, Spinner, Icon } from "design-system";
import { Colors } from "constants/Colors";
import type { ConversionCompleteLayoutProps } from "./ConversionCompleteLayout";
import { ConversionCompleteLayout } from "./ConversionCompleteLayout";

const Title = styled.h4`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-6);
`;

const Label = styled.p`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-normal);
  font-size: var(--ads-v2-font-size-5);
`;

const SnapshotDetails = styled.p`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-5);
`;

const SnapshotPost = styled.p`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-normal);
  font-size: var(--ads-v2-font-size-3);
`;

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
            <Spinner size="lg" />
            <Label className="pt-4">{spinner}</Label>
          </div>
        )}
        {conversionComplete && (
          <ConversionCompleteLayout {...conversionComplete} />
        )}
        {collapsibleMessage && (
          <Collapsible className="px-2" title={collapsibleMessage.title}>
            <Title>{collapsibleMessage.messageHeader}</Title>
            <ul className="text-sm text-gray-500 list-disc pl-4">
              {collapsibleMessage.messagePoints.map((text, id) => (
                <li key={id}>{text}</li>
              ))}
            </ul>
          </Collapsible>
        )}
        {selectDropDown && (
          <div className="w-2/4">
            <div className="pt-6 pb-2">
              <Label>{selectDropDown.labelText}</Label>
            </div>
            <Select
              // @ts-expect-error: type mismatch
              onSelect={selectDropDown.onSelect}
              value={selectDropDown.selected.value}
            >
              {selectDropDown.options.map((option) => {
                return (
                  <Option key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon name={option.icon} size="md" />
                      {option.label}
                    </div>
                  </Option>
                );
              })}
            </Select>
          </div>
        )}

        {snapShotDetails && (
          <>
            {snapShotDetails.labelText && (
              <div className="pt-6 pb-2">
                <Label>{snapShotDetails.labelText}</Label>
              </div>
            )}
            <div
              className="h-14 flex flex-row border border-gray-200 items-center gap-2 pl-3"
              style={snapShotStyles}
            >
              <Icon
                className="mx-3"
                // clickable={false}
                color={Colors.GRAY_600}
                name={snapShotDetails.icon}
                size="md"
                withWrapper
                wrapperColor={Colors.GRAY_600_OPAQUE}
              />
              <SnapshotDetails>{snapShotDetails.text}</SnapshotDetails>
            </div>
            {snapShotDetails.postText && (
              <div className="pt-2 mb-3">
                <SnapshotPost>{snapShotDetails.postText}</SnapshotPost>
              </div>
            )}
          </>
        )}
        <div className="flex flex-row pt-6 justify-between align-">
          {cancelButtonText ? (
            <Button
              className="t--convert-cancel-button"
              kind="tertiary"
              onClick={props.onCancel}
              size="md"
            >
              {cancelButtonText}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex flex-row justify-items-end gap-6">
            {secondaryButton && (
              <Button
                kind="secondary"
                onClick={secondaryButton.onClick}
                size="md"
              >
                {secondaryButton.text}
              </Button>
            )}
            {primaryButton && (
              <Button
                kind="primary"
                onClick={primaryButton.onClick}
                size="md"
                // variant={primaryButton.variant || Variant.info}
              >
                {primaryButton.text}
              </Button>
            )}
          </div>
        </div>
      </>
    );
  };
}
