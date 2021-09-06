import React from "react";
import styled from "styled-components";

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

  return (
    <ImageAnnotatorContainer>
      {"Image Annotator Widget"}
    </ImageAnnotatorContainer>
  );
}

export default ImageAnnotatorComponent;
