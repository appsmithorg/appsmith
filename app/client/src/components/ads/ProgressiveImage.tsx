import React from "react";
import { useEffect } from "react";
import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  .progressive-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .progressive-image--full {
    transition: opacity 300ms ease 0ms;
  }
  .progressive-image--thumb {
    filter: blur(2px);
    transition: visibility 0ms ease 300ms;
  }
`;

/**
 * Use a tiny blurred image (thumbnail) until the actual image is fetched
 */
function ProgressiveImage(props: {
  thumbnailSource?: string;
  imageSource?: string;
  alt?: string;
}) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [props.imageSource]);

  return (
    <Container className="container-progressive-image">
      <img
        alt={props.alt}
        className="progressive-image progressive-image--thumb"
        src={props.thumbnailSource}
        style={{ visibility: isLoaded ? "hidden" : "visible" }}
      />
      <img
        alt={props.alt}
        className="progressive-image progressive-image--full"
        onLoad={() => {
          setIsLoaded(true);
        }}
        src={props.imageSource}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    </Container>
  );
}
export default ProgressiveImage;
