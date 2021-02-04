import React from "react";
import styled from "styled-components";
import { HelpBaseURL } from "constants/HelpConstants";

type Props = {
  activeItemIndex: number;
  searchResults: Record<string, any>[];
};

const StyledContentView = styled.div`
  & iframe {
    height: calc(100% + 59px);
    margin-top: -59px;
    border: none;
  }
  padding: ${(props) => props.theme.spaces[10]}px;
`;

const ContentView = (props: Props) => {
  const { searchResults, activeItemIndex } = props;
  const activeItem = searchResults[activeItemIndex];
  const { path = "" } = activeItem || {};

  return (
    <StyledContentView>
      <iframe src={path.replace("master", HelpBaseURL)} />
    </StyledContentView>
  );
};

export default ContentView;
