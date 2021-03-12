import React, { SyntheticEvent } from "react";
import DocumentationSearch from "components/designSystems/appsmith/help/DocumentationSearch";
import { getHelpModalOpen } from "selectors/helpSelectors";
import {
  setHelpDefaultRefinement,
  setHelpModalVisibility,
} from "actions/helpActions";
import styled from "styled-components";
import { theme } from "constants/DefaultTheme";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import { HelpIcons } from "icons/HelpIcons";
import { getAppsmithConfigs } from "configs";
import { LayersContext } from "constants/Layers";
import { connect } from "react-redux";
import { AppState } from "reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { HELP_MODAL_HEIGHT, HELP_MODAL_WIDTH } from "constants/HelpConstants";

const { algolia } = getAppsmithConfigs();
const HelpButton = styled.button<{
  highlight: boolean;
  layer: number;
}>`
  &&&&& {
    position: fixed;
    bottom: 27px;
    right: 27px;
    z-index: ${(props) => props.layer};
    background: ${(props) =>
      props.highlight ? "#231f20" : theme.colors.primaryDarker};
    width: 50px;
    height: 50px;
    border-radius: 50%;
    color: white;
    border: 0;
    cursor: pointer;
    font-size: 20px;

    svg {
      width: 25px;
      height: 17px;
      position: absolute;
      top: 32%;
      right: 25%;
    }
  }
`;

const MODAL_WIDTH = HELP_MODAL_WIDTH;
const MODAL_HEIGHT = HELP_MODAL_HEIGHT;
const MODAL_BOTTOM_DISTANCE = 100;
const MODAL_RIGHT_DISTANCE = 27;

const HelpIcon = HelpIcons.HELP_ICON;
const CloseIcon = HelpIcons.CLOSE_ICON;

type Props = {
  isHelpModalOpen: boolean;
  dispatch: any;
  page: string;
};

class HelpModal extends React.Component<Props> {
  static contextType = LayersContext;

  /**
   * closes help modal
   *
   * @param event
   */
  onClose = (event: MouseEvent) => {
    const { dispatch, isHelpModalOpen } = this.props;

    event.stopPropagation();
    event.preventDefault();

    if (isHelpModalOpen === false) return false;

    dispatch(setHelpModalVisibility(false));
    dispatch(setHelpDefaultRefinement(""));
  };

  /**
   * opens help modal
   */
  onOpen = (event: SyntheticEvent<HTMLElement>) => {
    const { dispatch, isHelpModalOpen, page } = this.props;

    event.stopPropagation();
    event.preventDefault();
    AnalyticsUtil.logEvent("OPEN_HELP", { page });
    dispatch(setHelpModalVisibility(!isHelpModalOpen));
  };

  render() {
    const { isHelpModalOpen } = this.props;
    const layers = this.context;

    return (
      <>
        {isHelpModalOpen && (
          <ModalComponent
            canOutsideClickClose
            canEscapeKeyClose
            scrollContents
            height={MODAL_HEIGHT}
            width={MODAL_WIDTH}
            top={window.innerHeight - MODAL_BOTTOM_DISTANCE - MODAL_HEIGHT}
            left={window.innerWidth - MODAL_RIGHT_DISTANCE - MODAL_WIDTH}
            data-cy={"help-modal"}
            hasBackDrop={false}
            onClose={this.onClose}
            isOpen
            zIndex={layers.help}
          >
            <DocumentationSearch hitsPerPage={4} />
          </ModalComponent>
        )}
        {algolia.enabled && (
          <HelpButton
            className="t--helpGlobalButton"
            highlight={!isHelpModalOpen}
            layer={layers.max}
            onClick={this.onOpen}
          >
            {isHelpModalOpen ? (
              <CloseIcon height={50} width={50} />
            ) : (
              <HelpIcon height={50} width={50} />
            )}
          </HelpButton>
        )}
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isHelpModalOpen: getHelpModalOpen(state),
});

export default connect(mapStateToProps)(HelpModal);
