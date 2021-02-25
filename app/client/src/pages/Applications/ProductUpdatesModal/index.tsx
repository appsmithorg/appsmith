import React, { useState, useCallback, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import "@github/g-emoji-element";
import Dialog from "components/ads/DialogComponent";
import UpdatesButton from "./UpdatesButton";
import { AppState } from "reducers";
import { LayersContext } from "constants/Layers";
import ReleasesAPI from "api/ReleasesAPI";
import { resetReleasesCount } from "actions/releasesActions";
import { HelpIcons } from "icons/HelpIcons";
import ReleaseComponent, { Release, StyledSeparator } from "./ReleaseComponent";
import { withTheme } from "styled-components";
import { Color } from "constants/Colors";

const CloseIcon = HelpIcons.CLOSE_ICON;

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

const ViewInGithubLink = styled.a`
  cursor: pointer;
  text-decoration: none;
  :hover {
    text-decoration: underline;
    color: ${(props) => props.theme.colors.text.normal};
  }
  font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
  font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
  line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.releaseList.letterSpacing}px;
  color: ${(props) => props.theme.colors.text.normal};
  margin-right: ${(props) => props.theme.spaces[4]}px;
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

const Header = withTheme(
  ({ onClose, theme }: { onClose: () => void; theme: any }) => (
    <>
      <HeaderContents>
        <Heading>Product Updates</Heading>
        <HeaderRight>
          <ViewInGithubLink
            target="_blank"
            href="https://github.com/appsmithorg/appsmith/releases"
          >
            View on Github
          </ViewInGithubLink>
          <CloseIconContainer
            onClick={onClose}
            data-cy="t--product-updates-close-btn"
          >
            <CloseIcon
              height={20}
              width={20}
              color={theme.colors.text.normal as Color}
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

const ProductUpdatesModal = () => {
  const { releaseItems, newReleasesCount } = useSelector(
    (state: AppState) => state.ui.releases,
  );
  const dispatch = useDispatch();
  const onOpening = useCallback(async () => {
    setIsOpen(true);
    dispatch(resetReleasesCount());
    await ReleasesAPI.markAsRead();
  }, []);

  const Layers = useContext(LayersContext);
  const [isOpen, setIsOpen] = useState(false);

  return Array.isArray(releaseItems) && releaseItems.length > 0 ? (
    <Dialog
      trigger={<UpdatesButton newReleasesCount={newReleasesCount} />}
      width={"580px"}
      maxHeight={"80vh"}
      triggerZIndex={Layers.productUpdates}
      showHeaderUnderline
      onOpening={onOpening}
      isOpen={isOpen}
      getHeader={() => <Header onClose={() => setIsOpen(false)} />}
      canOutsideClickClose
      canEscapeKeyClose
    >
      {releaseItems.map((release: Release, index: number) => (
        <ReleaseComponent release={release} key={index} />
      ))}
    </Dialog>
  ) : null;
};

export default ProductUpdatesModal;
