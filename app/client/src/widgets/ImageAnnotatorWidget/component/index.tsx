import React from "react";
import styled from "styled-components";
import ReactImageAnnotate from "react-image-annotate";

const ImageAnnotatorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

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

export interface ImageAnnotatorComponentProps {
  imageUrl: string;
  onSave: (value: any) => void;
}

export default ImageAnnotatorComponent;
