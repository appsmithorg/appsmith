import React, { useState } from "react";
import styled from "styled-components";
import { Collapse, Icon, IconName, Tooltip } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { Colors } from "constants/Colors";
import { BindingText } from "pages/Editor/APIEditor/Form";
import { extraLibraries } from "utils/DynamicBindingUtils";

const Wrapper = styled.div`
  font-size: 13px;
`;
const ListItem = styled.li`
  list-style: none;
  color: ${Colors.ALTO};
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0 20px 0 20px;
  &:hover {
    background: ${Colors.TUNDORA};
    color: ${Colors.WHITE};
  }
`;
const Name = styled.span``;
const Version = styled.span``;
const Title = styled.div`
  display: grid;
  grid-template-columns: 20px auto 20px;
  cursor: pointer;
  height: 30px;
  align-items: center;
  &:hover {
    background: ${Colors.TUNDORA};
    color: ${Colors.WHITE};
  }
`;
const List = styled.ul`
  padding: 0px;
  margin: 0 0 0 0px;
`;
const Help = styled(Icon)`
  &:hover svg {
    fill: ${Colors.WHITE};
  }
`;
export const JSDependencies = () => {
  const [isOpen, setIsOpen] = useState(false);
  const openDocs = (name: string, url: string) => () => window.open(url, name);
  const dependencyList = extraLibraries.map(lib => {
    return (
      <ListItem
        key={lib.displayName}
        onClick={openDocs(lib.displayName, lib.docsURL)}
      >
        <Name>{lib.displayName}</Name>
        <Version>{lib.version}</Version>
      </ListItem>
    );
  });
  const icon: IconName = isOpen ? IconNames.CARET_DOWN : IconNames.CARET_RIGHT;
  const toggleDependencies = () => setIsOpen(!isOpen);
  const showDocs = (e: any) => {
    window.open(
      "https://docs.appsmith.com/core-concepts/connecting-ui-and-logic/working-with-js-libraries",
      "appsmith-docs:working-with-js-libraries",
    );
    e.stopPropagation();
    e.preventDefault();
  };

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
        <Icon icon={icon} />
        <span>Dependencies</span>
        <Tooltip content={TooltipContent} position="top" boundary="viewport">
          <Help
            icon="help"
            iconSize={12}
            color={Colors.DOVE_GRAY}
            onClick={showDocs}
          />
        </Tooltip>
      </Title>
      <Collapse isOpen={isOpen}>
        <List>{dependencyList}</List>
      </Collapse>
    </Wrapper>
  );
};

export default JSDependencies;
