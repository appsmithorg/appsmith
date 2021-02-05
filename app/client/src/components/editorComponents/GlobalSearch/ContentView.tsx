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
  .iframe-container {
    margin: 0 ${(props) => props.theme.spaces[10]}px;
    overflow: hidden;
    height: 100%;
  }
`;

const ContentView = (props: Props) => {
  const { searchResults, activeItemIndex } = props;
  const activeItem = searchResults[activeItemIndex];
  const { path = "" } = activeItem || {};

  return (
    <StyledContentView>
      <div className="iframe-container">
        <iframe src={path.replace("master", HelpBaseURL)} />
      </div>
    </StyledContentView>
  );
};

export default ContentView;
