import React from "react";
import styled from "styled-components";
import type { InfoBlockProps } from "./InfoBlock";
import { InfoBlock } from "./InfoBlock";
import type { DropdownOption } from "design-system-old";
import { Collapsible } from "design-system-old";
import type { CalloutKind } from "design-system";
import { Button, Select, Option, Spinner, Callout, Icon } from "design-system";
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

const SnapshotContainer = styled.div`
  height: 3.5rem;
  display: flex;
  flex-direction: row;
  border-width: 1px;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  padding-left: var(--ads-v2-spaces-3);
  margin-right: 1px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
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

const BannerText = styled.p`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-3);
`;

export type ConversionProps = {
  bannerMessageDetails?: {
    message: string;
    kind: CalloutKind;
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

export function ConversionForm(props: ConversionProps) {
  const {
    bannerMessageDetails,
    collapsibleMessage,
    conversionComplete,
    infoBlocks,
    primaryButton,
    secondaryButton,
    selectDropDown,
    snapShotDetails,
    spinner,
  } = props;

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
        <Callout kind={bannerMessageDetails.kind}>
          <BannerText>{bannerMessageDetails.message}</BannerText>
        </Callout>
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
          <SnapshotContainer style={snapShotStyles}>
            <Icon
              className="mx-3"
              color={Colors.GRAY_600}
              name={snapShotDetails.icon}
              size="md"
              withWrapper
              wrapperColor={Colors.GRAY_600_OPAQUE}
            />
            <SnapshotDetails>{snapShotDetails.text}</SnapshotDetails>
          </SnapshotContainer>
          {snapShotDetails.postText && (
            <div className="pt-2 mb-3">
              <SnapshotPost>{snapShotDetails.postText}</SnapshotPost>
            </div>
          )}
        </>
      )}
      <div className="mt-6 flex">
        <div className="flex flex-row ml-auto gap-6">
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
              onClick={() => {
                primaryButton.onClick();
              }}
              size="md"
            >
              {primaryButton.text}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
