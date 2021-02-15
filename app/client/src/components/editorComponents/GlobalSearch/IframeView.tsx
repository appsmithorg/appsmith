import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { HelpBaseURL } from "constants/HelpConstants";
import { noop } from "lodash";

type Props = {
  activeItemIndex: number;
  searchResults: Record<string, any>[];
};

const StyledContentView = styled.div`
  & iframe {
    height: calc(100% + 59px);
    margin-top: -59px;
    border: none;
    width: 100%;
  }
  flex: 1;
`;

const ContentView = (props: Props) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { searchResults, activeItemIndex } = props;
  const activeItem = searchResults[activeItemIndex];
  const { path = "" } = activeItem || {};
  // const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   setIsLoading(true);
  // }, [activeItemIndex]);

  useEffect(() => {
    // const setIsReady = () => setIsLoading(false);
    // if (iframeRef.current) {
    //   iframeRef.current.onload = setIsReady;
    // }
    return () => {
      if (iframeRef.current) {
        iframeRef.current.onload = noop;
      }
    };
  }, [iframeRef.current]);

  return (
    <StyledContentView>
      <iframe ref={iframeRef} src={path.replace("master", HelpBaseURL)} />
    </StyledContentView>
  );
};

export default ContentView;
