import React from "react";
import { connect } from "react-redux";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { HelpBaseURL } from "constants/HelpConstants";
import { AppState } from "reducers";

import {
  toggleShowGlobalSearchModal,
  updateActiveItemIndex,
} from "actions/globalSearchActions";

import DocsSearchModal from "./DocsSearchModal";

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

  get hotKeysConfig() {
    return [
      {
        combo: "shift + o",
        onKeyDown: () => {
          console.log("called");
          // setTimeout(() => {
          this.toggleShow();
          // }, 100);
        },
        hideWhenModalClosed: false,
        allowInInput: false,
      },
      {
        combo: "up",
        onKeyDown: this.handleUpKey,
        hideWhenModalClosed: true,
        allowInInput: true,
      },
      {
        combo: "down",
        onKeyDown: this.handleDownKey,
        hideWhenModalClosed: true,
        allowInInput: true,
      },
      {
        combo: "return",
        onKeyDown: this.handleOpenDocumentation,
        hideWhenModalClosed: true,
        allowInInput: true,
      },
      // {
      //   combo: "esc",
      //   onKeyDown: this.toggleShow,
      //   hideWhenModalClosed: true,
      //   allowInInput: true,
      // },
    ].filter(
      ({ hideWhenModalClosed }) =>
        !hideWhenModalClosed || (hideWhenModalClosed && this.props.modalOpen),
    );
  }

  renderHotkeys() {
    return (
      <Hotkeys>
        {this.hotKeysConfig.map(({ combo, onKeyDown, allowInInput }, index) => (
          <Hotkey
            key={index}
            global={true}
            combo={combo}
            onKeyDown={onKeyDown}
            label=""
            allowInInput={allowInInput}
          />
        ))}
      </Hotkeys>
    );
  }

  toggleShow = this.props.toggleShow;

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

  handleHideModal = (_e: KeyboardEvent) => this.toggleShow();

  handleOpenDocumentation = (_e: KeyboardEvent) => {
    const { activeItemIndex, helpResults } = this.props;
    const activeItem = helpResults[activeItemIndex];
    if (activeItem) {
      window.open(activeItem.path.replace("master", HelpBaseURL), "_blank");
    }
  };

  render() {
    const { modalOpen } = this.props;
    return (
      <>
        <div onClick={this.toggleShow}>shift + o</div>
        <DocsSearchModal modalOpen={modalOpen} toggleShow={this.toggleShow} />
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
