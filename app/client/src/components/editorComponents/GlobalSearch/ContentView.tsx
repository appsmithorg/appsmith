import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { AppState } from "reducers";
import { HelpBaseURL } from "constants/HelpConstants";

type Props = {
  modalOpen: boolean;
  activeItemIndex: number;
  helpResults: Record<string, any>[];
};

const StyledContentView = styled.div`
  & iframe {
    height: calc(100% + 59px);
    margin-top: -59px;
  }
`;

const ContentView = (props: Props) => {
  const { helpResults, activeItemIndex } = props;
  const activeItem = helpResults[activeItemIndex];

  const { path = "" } = activeItem || {};

  return (
    <StyledContentView>
      <iframe src={path.replace("master", HelpBaseURL)} />
    </StyledContentView>
  );
};

const mapStateToProps = (state: AppState) => {
  const {
    globalSearch: { modalOpen, activeItemIndex, helpResults },
  } = state.ui;
  return {
    modalOpen,
    activeItemIndex,
    helpResults,
  };
};

export default connect(mapStateToProps)(ContentView);
