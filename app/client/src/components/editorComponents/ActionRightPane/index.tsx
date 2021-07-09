import React from "react";
import styled from "styled-components";
import { Collapse, Classes as BPClasses } from "@blueprintjs/core";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import { useState } from "react";
import { getTypographyByKey } from "constants/DefaultTheme";
import Connections from "./Connections";
import SuggestedWidgets from "./SuggestedWidgets";
import { WidgetType } from "constants/WidgetConstants";
import { ReactNode } from "react";
import { useEffect } from "react";

const SideBar = styled.div`
  padding: 0px 8px 10px;
  overflow: auto;
  height: 100%;

  & > div {
    margin-top: 24px;
  }

  .icon-text {
    display: flex;
    margin-left: 7px;

    .connection-type {
      ${(props) => getTypographyByKey(props, "p1")}
    }
  }

  .icon-text:nth-child(2) {
    padding-top: 16px;
  }

  .description {
    ${(props) => getTypographyByKey(props, "p1")}
    margin-left: 7px;
    padding-bottom: 16px;
  }
`;

const Label = styled.span`
  cursor: pointer;
`;

const CollapsibleWrapper = styled.div<{ isOpen: boolean }>`
  .${BPClasses.COLLAPSE_BODY} {
    padding-top: 8px;
  }

  & > .icon-text:first-child {
    color: #090707;
    ${(props) => getTypographyByKey(props, "h4")}
    cursor: pointer;
    .${Classes.ICON} {
      ${(props) => !props.isOpen && `transform: rotate(-90deg);`}
    }

    .label {
      padding-left: 5px;
    }
  }
`;

type CollapsibleProps = {
  expand?: boolean;
  children: ReactNode;
  label: string;
};

export function Collapsible({
  children,
  expand = true,
  label,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(!!expand);

  useEffect(() => {
    setIsOpen(expand);
  }, [expand]);

  return (
    <CollapsibleWrapper isOpen={isOpen}>
      <Label className="icon-text" onClick={() => setIsOpen(!isOpen)}>
        <Icon name="downArrow" size={IconSize.XXS} />
        <span className="label">{label}</span>
      </Label>
      <Collapse isOpen={isOpen} keepChildrenMounted>
        {children}
      </Collapse>
    </CollapsibleWrapper>
  );
}

function ActionSidebar({
  actionName,
  hasResponse,
  suggestedWidget,
}: {
  actionName: string;
  hasResponse: boolean;
  suggestedWidget?: WidgetType;
}) {
  return (
    <SideBar>
      <Connections actionName={actionName} expand={!hasResponse} />
      {hasResponse && suggestedWidget && (
        <SuggestedWidgets
          actionName={actionName}
          suggestedWidget={suggestedWidget}
        />
      )}
    </SideBar>
  );
}

export default ActionSidebar;
