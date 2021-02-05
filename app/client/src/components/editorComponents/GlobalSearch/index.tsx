import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { HelpBaseURL } from "constants/HelpConstants";
import { AppState } from "reducers";

import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";

import DocsSearchModal from "./DocsSearchModal";
import AlgoliaSearchWrapper from "./AlgoliaSearchWrapper";

import SearchBox from "./SearchBox";
import SearchResults from "./SearchResults";
import ContentView from "./ContentView";

type Props = {
  toggleShow: () => void;
  modalOpen: boolean;
};

const StyledContainer = styled.div`
  width: 660px;
  height: 40vh;
  background: ${(props) => props.theme.colors.globalSearch.containerBackground};
  box-shadow: ${(props) => props.theme.colors.globalSearch.containerShadow};
  display: flex;
  flex-direction: column;
  & .main {
    display: flex;
    flex: 1;
    overflow: hidden;
    margin: ${(props) => props.theme.spaces[3]}px 0;
  }
`;

const Separator = styled.div`
  width: 1px;
  background-color: ${(props) => props.theme.colors.globalSearch.separator};
`;

@HotkeysTarget
class DocsSearch extends React.Component<Props> {
  state = { query: "", searchResults: [], activeItemIndex: 0 };

  get hotKeysConfig() {
    return [
      {
        combo: "shift + o",
        onKeyDown: this.toggleShow,
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
    const max = Math.max(this.state.searchResults.length - 1, 0);
    if (nextIndex < 0) return 0;
    else if (nextIndex > max) return max;
    else return nextIndex;
  };

  handleUpKey = (_e: KeyboardEvent) =>
    this.setState({
      activeItemIndex: this.getNextActiveItem(this.state.activeItemIndex - 1),
    });

  handleDownKey = (_e: KeyboardEvent) =>
    this.setState({
      activeItemIndex: this.getNextActiveItem(this.state.activeItemIndex + 1),
    });

  handleHideModal = (_e: KeyboardEvent) => this.toggleShow();

  handleOpenDocumentation = (_e: KeyboardEvent) => {
    const { searchResults, activeItemIndex } = this.state;
    const activeItem: any = searchResults[activeItemIndex];
    if (activeItem) {
      window.open(activeItem.path.replace("master", HelpBaseURL), "_blank");
    }
  };

  get query() {
    return this.state.query;
  }

  setQuery = (query: string) => this.setState({ query, activeItemIndex: 0 });

  get searchResults() {
    return this.state.searchResults;
  }

  setSearchResults = (results: any[]) => {
    this.setState({ searchResults: results });
  };

  get activeItemIndex() {
    return this.state.activeItemIndex;
  }

  setActiveItemIndex = (index: number) => {
    this.setState({ activeItemIndex: index });
  };
  render() {
    const { modalOpen } = this.props;

    return (
      <>
        <DocsSearchModal toggleShow={this.toggleShow} modalOpen={modalOpen}>
          <AlgoliaSearchWrapper query={this.query}>
            <StyledContainer>
              <SearchBox query={this.query} setQuery={this.setQuery} />
              <div className="main">
                <SearchResults
                  activeItemIndex={this.activeItemIndex}
                  searchResults={this.searchResults}
                  setSearchResults={this.setSearchResults}
                  setActiveItemIndex={this.setActiveItemIndex}
                />
                <Separator />
                <ContentView
                  activeItemIndex={this.activeItemIndex}
                  searchResults={this.searchResults}
                />
              </div>
            </StyledContainer>
          </AlgoliaSearchWrapper>
        </DocsSearchModal>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const {
    globalSearch: { modalOpen },
  } = state.ui;
  return {
    modalOpen,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  toggleShow: () => dispatch(toggleShowGlobalSearchModal()),
});

export default connect(mapStateToProps, mapDispatchToProps)(DocsSearch);
