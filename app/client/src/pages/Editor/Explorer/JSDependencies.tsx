import React, { useState } from "react";
import styled from "styled-components";
import { AppIcon as Icon, Size, TooltipComponent } from "design-system";
import { Colors } from "constants/Colors";
import { BindingText } from "pages/Editor/APIEditor/CommonEditorForm";
import { extraLibraries } from "utils/DynamicBindingUtils";
import CollapseToggle from "./Entity/CollapseToggle";
import Collapse from "./Entity/Collapse";

const Wrapper = styled.div`
  font-size: 14px;
`;
const ListItem = styled.li`
  list-style: none;
  color: ${Colors.GREY_8};
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0 12px 0 20px;
  position: relative;
  &:hover {
    background: ${Colors.ALABASTER_ALT};

    & .t--open-new-tab {
      display: block;
    }

    & .t--package-version {
      display: none;
    }
  }

  & .t--open-new-tab {
    position: absolute;
    right: 8px;
    display: none;
  }

  & .t--package-version {
    display: block;
  }
`;
const Name = styled.span``;
const Version = styled.span``;
const Title = styled.div`
  display: grid;
  grid-template-columns: 20px auto 20px;
  cursor: pointer;
  height: 32px;
  align-items: center;
  padding-right: 4px;
  padding-left: 0.25rem;
  font-size: 14px;
  &:hover {
    background: ${Colors.ALABASTER_ALT};
  }
  & .t--help-icon {
    svg {
      position: relative;
    }
  }
  span {
    color: ${Colors.GREY_800};
  }
`;

function JSDependencies() {
  const [isOpen, setIsOpen] = useState(false);
  const openDocs = (name: string, url: string) => () => window.open(url, name);
  const dependencyList = extraLibraries.map((lib) => {
    return (
      <ListItem
        key={lib.displayName}
        onClick={openDocs(lib.displayName, lib.docsURL)}
      >
        <Name>{lib.displayName}</Name>
        <Version className="t--package-version">{lib.version}</Version>
        <Icon className="t--open-new-tab" name="open-new-tab" size={Size.xxs} />
      </ListItem>
    );
  });

  const toggleDependencies = React.useCallback(
    () => setIsOpen((open) => !open),
    [],
  );
  const showDocs = React.useCallback((e: any) => {
    window.open(
      "https://docs.appsmith.com/v/v1.2.1/core-concepts/writing-code/ext-libraries",
      "appsmith-docs:working-with-js-libraries",
    );
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const TooltipContent = (
    <div>
      <span>Access these JS libraries to transform data within </span>
      <BindingText>{`{{ }}`}</BindingText>
      <span>. Try </span>
      <BindingText>{`{{ _.add(1,1) }}`}</BindingText>
    </div>
  );
  return (
    <Wrapper>
      <Title onClick={toggleDependencies}>
        <CollapseToggle
          className={""}
          disabled={false}
          isOpen={isOpen}
          isVisible={!!dependencyList}
          onClick={toggleDependencies}
        />
        <span className="ml-1 font-medium">Dependencies</span>
        <TooltipComponent content={TooltipContent} hoverOpenDelay={200}>
          <Icon
            className="t--help-icon"
            name="help"
            onClick={showDocs}
            size={Size.xxs}
          />
        </TooltipComponent>
      </Title>
      <Collapse isOpen={isOpen} step={0}>
        {dependencyList}
      </Collapse>
    </Wrapper>
  );
}

export default React.memo(JSDependencies);
