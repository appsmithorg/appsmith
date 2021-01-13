import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import "@github/g-emoji-element";
import { Link } from "react-router-dom";
import Dialog from "components/ads/DialogComponent";
import UpdatesButton from "./UpdatesButton";
import { AppState } from "reducers";
import { LayersContext } from "constants/Layers";
// import ReleasesAPI from "api/ReleasesAPI";
import { resetReleasesCount } from "actions/releasesActions";

const StyledContainer = styled.div`
  padding-top: ${(props) => props.theme.spaces[11]}px;
  color: ${(props) => props.theme.colors.text.normal};
`;

const StyledTitle = styled.div`
  font-weight: ${(props) => props.theme.typography.h2.fontWeight};
  font-size: ${(props) => props.theme.typography.h2.fontSize}px;
  line-height: ${(props) => props.theme.typography.h2.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.h2.letterSpacing}px;
  color: ${(props) => props.theme.colors.modal.title};
`;

const StyledSeparator = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.modal.separator};
  opacity: 0.6;
  height: 1px;
`;

const StyledDate = styled.div`
  font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
  font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
  line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.releaseList.letterSpacing}px;
  color: ${(props) => props.theme.colors.text.normal};
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const StyledContent = styled.div<{ maxHeight: number }>`
  li,
  p {
    font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
    font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
    line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
    letter-spacing: ${(props) =>
      props.theme.typography.releaseList.letterSpacing}px;
    color: ${(props) => props.theme.colors.text.normal};
  }
  a {
    color: ${(props) => props.theme.colors.modal.link};
  }
  h1,
  h2,
  h3,
  h4 {
    color: ${(props) => props.theme.colors.modal.title};
  }

  transition: max-height 0.15s ease-out;
  overflow: hidden;
  max-height: ${(props) => props.maxHeight}px;
`;

type Release = {
  descriptionHtml: string;
  name: string;
  publishedAt?: string;
};

type ReleaseProps = {
  release: Release;
};

enum ReleaseComponentViewState {
  "collapsed",
  "expanded",
}

const StyledReadMore = styled.div`
  font-weight: ${(props) => props.theme.typography.btnMedium.fontWeight};
  font-size: ${(props) => props.theme.typography.btnMedium.fontSize}px;
  line-height: ${(props) => props.theme.typography.btnMedium.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.btnMedium.letterSpacing}px;
  text-transform: uppercase;
  padding: ${(props) => props.theme.spaces[8]}px 0;
`;

const ReadMore = ({
  currentState,
  onClick,
}: {
  currentState: ReleaseComponentViewState;
  onClick: () => void;
}) => (
  <StyledReadMore onClick={onClick}>
    {currentState === ReleaseComponentViewState.collapsed
      ? "read more"
      : "read less"}
  </StyledReadMore>
);

const ReleaseComponent = ({ release }: ReleaseProps) => {
  const { name, publishedAt, descriptionHtml } = release;
  const [isCollapsed, setCollapsed] = useState(true);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      if (contentRef.current.scrollHeight >= 500) {
        setShouldShowReadMore(true);
      }
    }
  });

  const getReadMoreState = useCallback((): ReleaseComponentViewState => {
    if (isCollapsed) return ReleaseComponentViewState.collapsed;
    return ReleaseComponentViewState.expanded;
  }, [isCollapsed]);

  const toggleCollapsedState = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const getHeight = useCallback(() => {
    if (!contentRef.current) return 500;
    return isCollapsed ? 500 : contentRef.current.scrollHeight;
  }, [isCollapsed]);

  return (
    <StyledContainer>
      <StyledTitle>{name}</StyledTitle>
      <StyledDate>{moment(publishedAt).format("Do MMMM, YYYY")}</StyledDate>
      <StyledContent
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        maxHeight={getHeight()}
      />
      {shouldShowReadMore && (
        <ReadMore
          onClick={toggleCollapsedState}
          currentState={getReadMoreState()}
        />
      )}
      <StyledSeparator />
    </StyledContainer>
  );
};

const ProductUpdatesModal = () => {
  const { releaseItems, newReleasesCount } = useSelector(
    (state: AppState) => state.ui.releases,
  );
  const dispatch = useDispatch();
  const onOpened = useCallback(async () => {
    // await ReleasesAPI.markAsRead();
    dispatch(resetReleasesCount());
  }, []);

  const Layers = useContext(LayersContext);

  return (
    <Dialog
      trigger={<UpdatesButton newReleasesCount={newReleasesCount} />}
      title={"Product Updates"}
      width={"580px"}
      maxHeight={"80vh"}
      onOpened={onOpened}
      triggerZIndex={Layers.max}
      showHeaderUnderline
    >
      {releaseItems.map((release: Release, index: number) => (
        <ReleaseComponent release={release} key={index} />
      ))}
      <a
        href="https://github.com/appsmithorg/appsmith/releases"
        target="_blank"
        rel="noreferrer"
      >
        Github Releases
      </a>
    </Dialog>
  );
};

export default ProductUpdatesModal;
