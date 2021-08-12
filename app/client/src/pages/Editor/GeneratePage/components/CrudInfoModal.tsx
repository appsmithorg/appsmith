import React, { SyntheticEvent } from "react";
import styled from "styled-components";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import { HelpIcons } from "icons/HelpIcons";
import { connect } from "react-redux";
import { AppState } from "reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Button, { Category } from "components/ads/Button";
import withTheme from "styled-components";
import { Color } from "constants/Colors";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconProps } from "components/ads/Icon";
import { getCrudInfoModalOpen } from "selectors/crudInfoModalSelectors";

const CloseIcon = HelpIcons.CLOSE_ICON;

type Props = {
  crudInfoModalOpen: boolean;
  dispatch: any;
};

const HeaderContents = styled.div`
  padding: ${(props) => props.theme.spaces[9]}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const Heading = styled.div`
  color: ${(props) => props.theme.colors.modal.headerText};
  display: flex;
  justify-content: center;
  font-weight: ${(props) => props.theme.typography.h1.fontWeight};
  font-size: ${(props) => props.theme.typography.h1.fontSize}px;
  line-height: ${(props) => props.theme.typography.h1.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.h1.letterSpacing};
`;

const HeaderRight = styled.div`
  display: flex;
`;

const CloseIconContainer = styled.div`
  width: 20px;
  height: 20px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) => props.theme.colors.modal.hoverState};
  }
`;

const ActionButtonWrapper = styled.div`
  display: flex;
  margin: 30px 0px 0px;
`;

export const StyledSeparator = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.modal.separator};
  opacity: 0.6;
  height: 1px;
`;

const StyledIcon = styled(Icon)<IconProps>`
  margin: 0px 8px;
  svg {
    .triangle {
      fill: #efa903;
    }
    .symbol {
      fill: #ffffff;
    }
  }
  &:hover {
    .triangle {
      fill: #efa903;
    }
    .symbol {
      fill: #ffffff;
    }
  }
`;

const ActionButton = styled(Button)`
  margin-right: 16px;
`;

const Content = styled.div`
  margin: 8px 0px;
`;

const Header = withTheme(
  ({ onClose, theme }: { onClose: () => void; theme: any }) => (
    <>
      <HeaderContents>
        <Heading>
          <StyledIcon
            className="default_cursor"
            clickable={false}
            name="warning-triangle"
            // size={IconSize.XL}
          />
          HEADING
        </Heading>
        <HeaderRight>
          <CloseIconContainer
            data-cy="t--product-updates-close-btn"
            onClick={onClose}
          >
            <CloseIcon
              color={theme.colors.text.normal as Color}
              height={20}
              width={20}
            />
          </CloseIconContainer>
        </HeaderRight>
      </HeaderContents>
      <div style={{ padding: `0 ${theme.spaces[9]}px` }}>
        <StyledSeparator />
      </div>
    </>
  ),
);

function GenCRUDSuccessModal(props: Props) {
  const { crudInfoModalOpen, dispatch } = props;
  /**
   * closes help modal
   *
   * @param event
   */
  const onClose = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (crudInfoModalOpen === false) return false;
  };

  /**
   * opens help modal
   */
  const onOpen = (event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();

    // dispatch(setHelpModalVisibility(!isGenCRUDSuccessModalOpen));
  };

  return (
    <div>
      {crudInfoModalOpen && (
        <ModalComponent
          canEscapeKeyClose
          canOutsideClickClose
          data-cy={"help-modal"}
          hasBackDrop
          isOpen
          // left={window.innerWidth - MODAL_RIGHT_DISTANCE - MODAL_WIDTH}
          onClose={onClose}
          scrollContents={false}
          // top={window.innerHeight - MODAL_BOTTOM_DISTANCE - MODAL_HEIGHT}
          // width={MODAL_WIDTH}
          // zIndex={layers.help}
        >
          <Content>
            <Text type={TextType.H5}>AAAAA</Text>
            <br />
            <br />
            <Text type={TextType.P1}>BBSBSBS</Text>
          </Content>

          <ActionButtonWrapper>
            <ActionButton
              category={Category.primary}
              onClick={() => {
                // handleClose();
                AnalyticsUtil.logEvent(
                  "UNSUPPORTED_PLUGIN_DIALOG_CONTINUE_ACTION",
                );
                // onContinue();
              }}
              // size={Size.medium}
              text="CONTINUE BUILDING"
            />
          </ActionButtonWrapper>
        </ModalComponent>
      )}
    </div>
  );
}

const mapStateToProps = (state: AppState) => ({
  crudInfoModalOpen: getCrudInfoModalOpen(state),
});

export default connect(mapStateToProps)(GenCRUDSuccessModal);
