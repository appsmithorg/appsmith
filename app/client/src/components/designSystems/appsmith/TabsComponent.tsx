import React from "react";
import styled from "styled-components";

interface TabsComponentProps {
  isVisible?: boolean;
  tabs?: Array<{
    id: string;
    label: string;
  }>;
  selectedTabId?: string;
  onTabChange: (tabId: string) => void;
}

const TabsContainer = styled.div`
  && {
    height: 32px;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }
`;

type TabProps = {
  selected?: boolean;
};

const StyledTab = styled.div`
  height: 32px;
  border-bottom: 1px solid;
  border-color: ${props => props.theme.colors.bodyBG};
  width: 100%;
`;

const StyledText = styled.div<TabProps>`
  white-space: nowrap;
  background: ${props => props.theme.colors.builderBodyBG};
  color: ${props => props.theme.colors.menuIconColorInactive};
  font-size: ${props => props.theme.fontSizes[3]}px;
  line-height: 32px;
  height: 32px;
  padding: 0 16px;
  cursor: pointer;
  box-shadow: ${props => (props.selected ? props.theme.shadows[2] : "")};
  border-bottom: ${props => (props.selected ? "none" : "1px solid")};
  border-color: ${props => props.theme.colors.bodyBG};
  &:hover {
    background: ${props =>
      props.selected
        ? props.theme.colors.textOnDarkBG
        : props.theme.colors.hover};
    box-shadow: ${props => (props.selected ? "" : props.theme.shadows[3])};
  }
`;

class TabsComponent extends React.Component<TabsComponentProps> {
  selectTab = (tab: { id: string; label: string }) => {
    this.props.onTabChange(tab.id);
  };

  render() {
    return (
      <TabsContainer>
        {this.props.tabs &&
          this.props.tabs.map((tab, index) => (
            <StyledText
              onClick={this.selectTab.bind(this, tab)}
              selected={this.props.selectedTabId === tab.id}
              key={index}
            >
              {tab.label}
            </StyledText>
          ))}
        <StyledTab></StyledTab>
      </TabsContainer>
    );
  }
}

export default TabsComponent;
