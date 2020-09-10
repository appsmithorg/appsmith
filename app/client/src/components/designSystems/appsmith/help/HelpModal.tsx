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
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";

const { algolia, cloudHosting, intercomAppID } = getAppsmithConfigs();
const HelpButton = styled.button<{
  highlight: boolean;
  layer: number;
}>`
  &&&&& {
    position: absolute;
    bottom: 27px;
    right: 27px;
    z-index: ${props => props.layer};
    background: ${props =>
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

const MODAL_WIDTH = 240;
const MODAL_HEIGHT = 210;
const MODAL_BOTTOM_DISTANCE = 45;
const MODAL_RIGHT_DISTANCE = 30;

const HelpIcon = HelpIcons.HELP_ICON;

type Props = {
  isHelpModalOpen: boolean;
  dispatch: any;
  user?: User;
};

class HelpModal extends React.Component<Props> {
  static contextType = LayersContext;

  componentDidMount() {
    const { user } = this.props;
    if (cloudHosting && intercomAppID && window.Intercom) {
      window.Intercom("boot", {
        // eslint-disable-next-line @typescript-eslint/camelcase
        app_id: intercomAppID,
        // eslint-disable-next-line @typescript-eslint/camelcase
        user_id: user?.username,
        // eslint-disable-next-line @typescript-eslint/camelcase
        custom_launcher_selector: "#intercom-trigger",
        name: user?.name,
        email: user?.email,
      });
    }
  }

  render() {
    const { dispatch, isHelpModalOpen } = this.props;
    const layers = this.context;

    return (
      <>
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
          onClose={(event: SyntheticEvent<HTMLElement>) => {
            dispatch(setHelpModalVisibility(false));
            dispatch(setHelpDefaultRefinement(""));
            event.stopPropagation();
            event.preventDefault();
          }}
          isOpen={isHelpModalOpen}
          zIndex={layers.help}
        >
          <DocumentationSearch hitsPerPage={4} />
        </ModalComponent>
        {algolia.enabled && (
          <HelpButton
            className="t--helpGlobalButton"
            highlight={!isHelpModalOpen}
            layer={layers.help}
            onClick={() => {
              dispatch(setHelpModalVisibility(!isHelpModalOpen));
            }}
          >
            <HelpIcon />
          </HelpButton>
        )}
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isHelpModalOpen: getHelpModalOpen(state),
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(HelpModal);
