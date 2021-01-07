import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import "@github/g-emoji-element";
import Dialog from "components/ads/DialogComponent";
import UpdatesButton from "./UpdatesButton";
import { AppState } from "reducers";
import { LayersContext } from "constants/Layers";
// import ReleasesAPI from "api/ReleasesAPI";

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

const StyledContent = styled.div<{ isCollapsed: boolean }>`
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

  max-height: ${(props) => (props.isCollapsed ? "500px" : "auto")};
  overflow: hidden;
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      if (containerRef.current.clientHeight >= 500) {
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

  return (
    <StyledContainer ref={containerRef}>
      <StyledTitle>{name}</StyledTitle>
      <StyledDate>{moment(publishedAt).format("Do MMMM, YYYY")}</StyledDate>
      <StyledContent
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        isCollapsed={isCollapsed}
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
  const onOpened = useCallback(() => {
    // if (releaseItems.length > 0) {
    //   ReleasesAPI.markAsRead({ lastReadRelease: releaseItems[0].tagName });
    // }
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
    >
      {releaseItems.map((release: Release, index: number) => (
        <ReleaseComponent release={release} key={index} />
      ))}
    </Dialog>
  );
};

export default ProductUpdatesModal;
