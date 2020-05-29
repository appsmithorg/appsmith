import React, { useContext } from "react";
import DocumentationSearch from "components/designSystems/appsmith/help/DocumentationSearch";
import Button from "components/editorComponents/Button";

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
import { IntentColors, theme } from "constants/DefaultTheme";
import { Position } from "@blueprintjs/core";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import { LayersContext } from "constants/Layers";

const HelpButton = styled(Button)<{
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
    width: 105px;
    height: 40px;
    border-radius: 134px;
    color: white;
    border: 0;
    box-shadow: 2px 4px 5px #888888;
  }
`;

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
        top={window.innerHeight - 95 - helpDimensions.height}
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
      <HelpButton
        className="t--helpGlobalButton"
        highlight={!helpModalOpen}
        text="Docs"
        icon="search"
        filled
        intent={IntentColors.primary}
        iconAlignment={Position.LEFT}
        layer={layers.help}
        onClick={() => {
          dispatch(setHelpModalVisibility(!helpModalOpen));
        }}
      />
    </>
  );
}
