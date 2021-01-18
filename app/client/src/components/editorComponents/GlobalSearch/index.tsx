import React from "react";
import { connect } from "react-redux";
import ReactDOM from "react-dom";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import styled from "styled-components";

import Container from "./Container";
import { AppState } from "reducers";

import {
  toggleShowGlobalSearchModal,
  updateActiveItemIndex,
} from "actions/globalSearchActions";

const StyledDocsSearchModal = styled.div`
  position: absolute;
  top: 100px;
  left: 100px;
  z-index: 12;
`;

const DocsSearchModal = () => (
  <StyledDocsSearchModal>
    <Container />
  </StyledDocsSearchModal>
);

type Props = {
  updateActiveItemIndex: (index: number) => void;
  toggleShow: () => void;
  modalOpen: boolean;
  activeItemIndex: number;
  helpResults: Array<Record<string, any>>;
};

@HotkeysTarget
class DocsSearch extends React.Component<Props> {
  state = { show: false };

  renderHotkeys() {
    console.log(this.props.modalOpen, "open");
    return (
      <Hotkeys>
        <Hotkey
          global={true}
          combo="shift + o"
          label="Toggle help center"
          onKeyDown={this.toggleShow}
        />
        {this.props.modalOpen && (
          <Hotkey
            global={true}
            combo="up"
            label="UP"
            onKeyDown={this.handleUpKey}
          />
        )}
        {this.props.modalOpen && (
          <Hotkey
            global={true}
            combo="down"
            label="DOWN"
            onKeyDown={this.handleDownKey}
          />
        )}
      </Hotkeys>
    );
  }

  getNextActiveItem = (nextIndex: number) => {
    const max = this.props.helpResults.length - 1;
    if (nextIndex < 0) return 0;
    else if (nextIndex > max) return max;
    else return nextIndex;
  };

  handleUpKey = (_e: KeyboardEvent) => {
    this.props.updateActiveItemIndex(
      this.getNextActiveItem(this.props.activeItemIndex - 1),
    );
  };

  handleDownKey = (_e: KeyboardEvent) =>
    this.props.updateActiveItemIndex(
      this.getNextActiveItem(this.props.activeItemIndex + 1),
    );

  toggleShow = this.props.toggleShow;

  render() {
    const { modalOpen } = this.props;
    return (
      <>
        <div onClick={this.toggleShow}>shift + o</div>
        {modalOpen && ReactDOM.createPortal(<DocsSearchModal />, document.body)}
      </>
    );
  }
}

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

const mapDispatchToProps = (dispatch: any) => ({
  toggleShow: () => dispatch(toggleShowGlobalSearchModal()),
  updateActiveItemIndex: (index: number) =>
    dispatch(updateActiveItemIndex(index)),
});

export default connect(mapStateToProps, mapDispatchToProps)(DocsSearch);
