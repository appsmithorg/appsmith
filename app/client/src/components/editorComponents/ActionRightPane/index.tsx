import React from "react";
import styled from "styled-components";
import { Collapse, Classes as BPClasses } from "@blueprintjs/core";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import { useState } from "react";
import { getTypographyByKey } from "constants/DefaultTheme";
import Connections from "./Connections";
import SuggestedWidgets from "./SuggestedWidgets";

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

export function Collapsible(props: any) {
  const [expand, setExpand] = useState(true);

  return (
    <CollapsibleWrapper isOpen={expand}>
      <Label className="icon-text" onClick={() => setExpand(!expand)}>
        <Icon name="downArrow" size={IconSize.XXS} />
        <span className="label">{props.label}</span>
      </Label>
      <Collapse isOpen={expand} keepChildrenMounted>
        {props.children}
      </Collapse>
    </CollapsibleWrapper>
  );
}

function ActionSidebar(props: any) {
  return (
    <SideBar>
      <Connections actionName={props.actionName} />
      {props.hasResponse && <SuggestedWidgets actionName={props.actionName} />}
    </SideBar>
  );
}

export default ActionSidebar;
