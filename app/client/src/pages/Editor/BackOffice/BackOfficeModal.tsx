import React, { useCallback } from "react";
import { Classes, MENU_HEIGHT } from "../gitSync/constants";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { getIsBackOfficeModalOpen } from "selectors/backOfficeSelectors";
import { setIsBackOfficeModalOpen } from "actions/backOfficeActions";

import { DialogComponent as Dialog, Icon, IconSize } from "design-system-old";

import { useDispatch, useSelector } from "react-redux";
import { Theme } from "constants/DefaultTheme";
const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const BodyContainer = styled.div`
  flex: 3;
  height: calc(100% - ${MENU_HEIGHT}px);
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: -5px;
  top: 0;
  padding: ${(props) => props.theme.spaces[1]}px 0;
  border-radius: ${(props) => props.theme.radii[1]}px;

  &:hover {
    svg,
    svg path {
      fill: ${({ theme }) => get(theme, "colors.gitSyncModal.closeIconHover")};
    }
  }
`;

function BackOfficeModal() {
  const theme = useTheme() as Theme;
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsBackOfficeModalOpen);

  const handleClose = useCallback(() => {
    dispatch(setIsBackOfficeModalOpen(false));
  }, [dispatch, setIsBackOfficeModalOpen]);

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      className={Classes.GIT_SYNC_MODAL}
      data-testid="t--git-sync-modal"
      isOpen={isModalOpen}
      maxWidth={"900px"}
      noModalBodyMarginTop
      onClose={handleClose}
      width={"535px"}
    >
      <Container>
        <BodyContainer>
          <p>Connect BO</p>
        </BodyContainer>
        <CloseBtnContainer
          className="t--close-git-sync-modal"
          onClick={handleClose}
        >
          <Icon
            fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
            name="close-modal"
            size={IconSize.XXXXL}
          />
        </CloseBtnContainer>
      </Container>
    </Dialog>
  );
}

export default BackOfficeModal;
