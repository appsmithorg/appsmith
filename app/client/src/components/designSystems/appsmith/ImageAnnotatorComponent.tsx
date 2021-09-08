import React from "react";
import styled from "styled-components";
import ReactImageAnnotate from "react-image-annotate";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

const ImageAnnotatorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

export interface ImageAnnotatorComponentProps extends ComponentProps {
  imageUrl: string;
  onSave: (value: any) => void;
}

function ImageAnnotatorComponent(props: ImageAnnotatorComponentProps) {
  const { imageUrl, onSave } = props;

  const images = [
    {
      src: imageUrl,
      regions: [],
    },
  ];

  const regionClsList = ["A"];

  return (
    <ImageAnnotatorContainer>
      <ReactImageAnnotate
        images={images}
        onExit={onSave}
        regionClsList={regionClsList}
      />
    </ImageAnnotatorContainer>
  );
}

export default ImageAnnotatorComponent;
