import React, { useContext } from "react";
import DocumentationSearch from "components/designSystems/appsmith/help/DocumentationSearch";

import { useSelector } from "store";
import { useDispatch } from "react-redux";
import {
  getHelpModalOpen,
  getHelpModalDimensions,
} from "selectors/helpSelectors";
import {
  setHelpDefaultRefinement,
  setHelpModalVisibility,
} from "actions/helpActions";
import styled from "styled-components";
import { theme } from "constants/DefaultTheme";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import { LayersContext } from "constants/Layers";
import { HelpIcons } from "icons/HelpIcons";
import { getAppsmithConfigs } from "configs";
const { algolia } = getAppsmithConfigs();
const HelpButton = styled.div<{
  highlight: boolean;
  layer: number;
}>`
  &&&&& {
    position: absolute;
    bottom: 46px;
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

const HelpIcon = HelpIcons.HELP_ICON;

export function HelpModal() {
  const isHelpModalOpen = useSelector(getHelpModalOpen);
  const helpDimensions = useSelector(getHelpModalDimensions);
  const helpModalOpen = useSelector(getHelpModalOpen);
  const dispatch = useDispatch();
  const layers = useContext(LayersContext);

  return (
    <>
      <ModalComponent
        canOutsideClickClose
        canEscapeKeyClose
        scrollContents
        width={helpDimensions.width}
        height={helpDimensions.height}
        top={window.innerHeight - 105 - helpDimensions.height}
        left={window.innerWidth - 31 - helpDimensions.width}
        data-cy={"help-modal"}
        hasBackDrop={false}
        onClose={() => {
          dispatch(setHelpModalVisibility(false));
          dispatch(setHelpDefaultRefinement(""));
        }}
        isOpen={isHelpModalOpen}
        zIndex={layers.help}
      >
        <DocumentationSearch hitsPerPage={5} />
      </ModalComponent>
      {algolia.enabled && (
        <HelpButton
          className="t--helpGlobalButton"
          highlight={!helpModalOpen}
          layer={layers.help}
          onClick={() => {
            dispatch(setHelpModalVisibility(!helpModalOpen));
          }}
        >
          <HelpIcon />
        </HelpButton>
      )}
    </>
  );
}
