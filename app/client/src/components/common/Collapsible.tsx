import type { MutableRefObject, ReactNode } from "react";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Collapse, Classes as BPClasses } from "@blueprintjs/core";
import { Icon, Text, Tooltip } from "design-system";
import { Classes, getTypographyByKey } from "design-system-old";
import type { Datasource } from "entities/Datasource";

const Label = styled.span`
  cursor: pointer;
  min-height: 36px;
  display: flex;
  align-items: center;
`;

const CollapsibleWrapper = styled.div<{
  isOpen: boolean;
  isDisabled?: boolean;
}>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${(props) => !!props.isDisabled && `opacity: 0.6`};

  &&&&&& .${BPClasses.COLLAPSE} {
    flex-grow: 1;
    overflow-y: auto !important;
  }

  .${BPClasses.COLLAPSE_BODY} {
    padding-top: ${(props) => props.theme.spaces[3]}px;
    padding-bottom: ${(props) => props.theme.spaces[3]}px;
    height: 100%;
  }

  & > .icon-text:first-child {
    color: var(--ads-v2-color-fg);
    ${getTypographyByKey("h4")}
    cursor: pointer;
    .${Classes.ICON} {
      ${(props) => !props.isOpen && `transform: rotate(-90deg);`}
    }

    .label {
      padding-left: ${(props) => props.theme.spaces[1] + 1}px;
    }
  }
`;

const GroupWrapper = styled.div<
  Pick<CollapsibleGroupProps, "height" | "maxHeight">
>`
  min-height: 25%;
  height: ${({ height }) => height};
  max-height: ${({ maxHeight }) => maxHeight};
`;

export const CollapsibleGroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

interface DisabledCollapsibleProps {
  label: string;
  tooltipLabel?: string;
}

export interface CollapsibleProps {
  expand?: boolean;
  children: ReactNode;
  label: string;
  CustomLabelComponent?: (props: any) => JSX.Element;
  isDisabled?: boolean;
  datasource?: Partial<Datasource>;
  containerRef?: MutableRefObject<HTMLDivElement | null>;
}

interface CollapsibleGroupProps {
  children: ReactNode;
  height?: string;
  maxHeight?: string;
}

export function DisabledCollapsible({
  label,
  tooltipLabel = "",
}: DisabledCollapsibleProps) {
  return (
    <Tooltip content={tooltipLabel}>
      <CollapsibleWrapper isDisabled isOpen={false}>
        <Label className="icon-text">
          <Icon name="arrow-right-s-line" size="lg" />
          <Text className="label" kind="heading-xs">
            {label}
          </Text>
        </Label>
      </CollapsibleWrapper>
    </Tooltip>
  );
}

export function CollapsibleGroup({
  children,
  height,
  maxHeight,
}: CollapsibleGroupProps) {
  return (
    <GroupWrapper height={height} maxHeight={maxHeight}>
      {children}
    </GroupWrapper>
  );
}

export function Collapsible({
  children,
  containerRef,
  CustomLabelComponent,
  datasource,
  expand = true,
  label,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(!!expand);

  const handleCollapse = (openStatus: boolean) => {
    if (containerRef?.current) {
      if (openStatus) {
        containerRef.current.style.height = "";
      } else {
        containerRef.current.style.height = "auto";
      }
    }
    setIsOpen(openStatus);
  };

  useEffect(() => {
    handleCollapse(expand);
  }, [expand]);

  return (
    <CollapsibleWrapper isOpen={isOpen}>
      <Label className="icon-text" onClick={() => handleCollapse(!isOpen)}>
        <Icon
          className="collapsible-icon"
          name={isOpen ? "down-arrow" : "arrow-right-s-line"}
          size="lg"
        />
        {!!CustomLabelComponent ? (
          <CustomLabelComponent
            datasource={datasource}
            onRefreshCallback={() => handleCollapse(true)}
          />
        ) : (
          <Text className="label" kind="heading-xs">
            {label}
          </Text>
        )}
      </Label>
      <Collapse isOpen={isOpen} keepChildrenMounted>
        {children}
      </Collapse>
    </CollapsibleWrapper>
  );
}

export default Collapsible;
