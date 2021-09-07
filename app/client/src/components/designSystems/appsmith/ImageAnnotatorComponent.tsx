import React from "react";
import styled from "styled-components";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ReactImageAnnotate from "react-image-annotate";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

const ImageAnnotatorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

export interface ImageAnnotatorComponentProps extends ComponentProps {
  imageUrl: string;
}

function ImageAnnotatorComponent(props: ImageAnnotatorComponentProps) {
  const { imageUrl } = props;

  const images = [
    {
      src: imageUrl,
      regions: [],
    },
  ];

  const regionClsList = [""];

  const handleExit = (data: any) => {
    console.error(data);
  };

  return (
    <ImageAnnotatorContainer>
      <ReactImageAnnotate
        images={images}
        onExit={handleExit}
        regionClsList={regionClsList}
      />
    </ImageAnnotatorContainer>
  );
}

export default ImageAnnotatorComponent;
