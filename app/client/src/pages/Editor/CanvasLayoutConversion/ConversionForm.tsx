import React from "react";
import styled from "styled-components";
import type { InfoBlockProps } from "./InfoBlock";
import { InfoBlock } from "./InfoBlock";
import type { CalloutKind, SegmentedControlOption } from "@appsmith/ads";
import {
  Button,
  SegmentedControl,
  Spinner,
  Callout,
  Icon,
  Text,
} from "@appsmith/ads";
import type { ConversionCompleteLayoutProps } from "./ConversionCompleteLayout";
import { ConversionCompleteLayout } from "./ConversionCompleteLayout";

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

interface ButtonInfo {
  text: string;
  closeModal?: boolean;
  onClick: () => void;
}

export interface ConversionProps {
  bannerMessageDetails?: {
    message: string;
    kind: CalloutKind;
  };
  cancelButtonText?: string;
  infoBlocks?: InfoBlockProps[];
  spinner?: string;
  primaryButton?: ButtonInfo;
  secondaryButton?: ButtonInfo;
  conversionComplete?: ConversionCompleteLayoutProps;
  collapsibleMessage?: {
    title: string;
    messageHeader: string;
    messagePoints: string[];
  };
  selectDropDown?: {
    selected: string;
    onSelect: (value: string) => void;
    options: SegmentedControlOption[];
    labelText: string;
  };
  snapShotDetails?: {
    postText?: string;
    labelText?: string;
    icon: string;
    text: string;
  };
}

export function ConversionForm(
  props: ConversionProps & { closeModal: () => void },
) {
  const {
    bannerMessageDetails,
    closeModal,
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

  const onPrimaryButtonClick = (primaryButton: ButtonInfo) => {
    primaryButton.onClick();
    if (primaryButton.closeModal) {
      closeModal();
    }
  };

  return (
    <>
      {bannerMessageDetails && (
        <Callout kind={bannerMessageDetails.kind}>
          {bannerMessageDetails.message}
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
          <Text kind="action-l" renderAs="p">
            {spinner}
          </Text>
        </div>
      )}
      {conversionComplete && (
        <ConversionCompleteLayout {...conversionComplete} />
      )}
      {collapsibleMessage && (
        <div className="px-2">
          <Text kind="heading-s" renderAs="h4">
            {collapsibleMessage.messageHeader}
          </Text>
          <ul className="list-disc pl-4 mt-1">
            {collapsibleMessage.messagePoints.map((text, id) => (
              <li key={id}>
                <Text kind="action-m">{text}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectDropDown && (
        <div className="w-2/4">
          <div className="pt-6 pb-2">
            <Text kind="action-l" renderAs="p">
              {selectDropDown.labelText}
            </Text>
          </div>
          <SegmentedControl
            onChange={selectDropDown.onSelect}
            options={selectDropDown.options}
            value={selectDropDown.selected}
          />
        </div>
      )}

      {snapShotDetails && (
        <>
          {snapShotDetails.labelText && (
            <div className="pt-6 pb-2">
              <Text kind="action-l" renderAs="p">
                {snapShotDetails.labelText}
              </Text>
            </div>
          )}
          <SnapshotContainer style={snapShotStyles}>
            <Icon
              className="mx-1"
              color="var(--ads-v2-color-gray-600)"
              name={snapShotDetails.icon}
              size="lg"
            />
            <Text kind="action-l" renderAs="p">
              {snapShotDetails.text}
            </Text>
          </SnapshotContainer>
          {snapShotDetails.postText && (
            <div className="pt-2 mb-3">
              <Text kind="action-l" renderAs="p">
                {snapShotDetails.postText}
              </Text>
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
              onClick={() => onPrimaryButtonClick(primaryButton)}
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
