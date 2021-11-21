import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { Annotation, IAnnotation } from "react-image-annotation-ts";
import { AnnotationSelector } from "../constants";

const ImageAnnotatorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  & > div {
    z-index: 1;
  }
  & img {
    height: 100%;
  }
`;

function ImageAnnotatorComponent(props: ImageAnnotatorComponentProps) {
  const {
    annotation,
    annotations,
    disabled,
    imageAltText,
    imageUrl,
    onChange,
    onReset,
    onSubmit,
    selector,
  } = props;

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onReset();
  }, [imageUrl]);

  return (
    <ImageAnnotatorContainer>
      <Annotation
        alt={imageAltText}
        annotations={annotations}
        disableAnnotation={disabled}
        disableOverlay={disabled}
        onChange={onChange}
        onSubmit={onSubmit}
        src={imageUrl}
        type={selector}
        value={annotation}
      />
    </ImageAnnotatorContainer>
  );
}

export interface ImageAnnotatorComponentProps {
  annotation: IAnnotation;
  annotations: IAnnotation[];
  imageAltText?: string;
  imageUrl: string;
  disabled?: boolean;
  onChange: (annotation: IAnnotation) => void;
  onReset: () => void;
  onSubmit: (annotation: IAnnotation) => void;
  selector: AnnotationSelector;
}

export default ImageAnnotatorComponent;
