import React, { useState } from "react";
import styled from "styled-components";
import { Annotation, IAnnotation } from "react-image-annotation-ts";

const ImageAnnotatorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

function ImageAnnotatorComponent(props: ImageAnnotatorComponentProps) {
  const { annotation, annotations, imageUrl, onSubmit } = props;
  const [annotationState, setannotationState] = useState(annotation);
  const handleChange = (annotation: IAnnotation) => {
    setannotationState(annotation);
    console.error("annotation is changed");
  };

  const handleSubmit = (annotation: IAnnotation) => {
    const { data, geometry } = annotation;
    console.error(geometry);
  };

  return (
    <ImageAnnotatorContainer>
      <Annotation
        annotations={annotations}
        onChange={handleChange}
        onSubmit={handleSubmit}
        src={imageUrl}
        value={annotationState}
      />
    </ImageAnnotatorContainer>
  );
}

export interface ImageAnnotatorComponentProps {
  annotation: IAnnotation;
  annotations?: IAnnotation[];
  imageUrl: string;
  onSubmit: (annotation: IAnnotation) => void;
}

export default ImageAnnotatorComponent;
