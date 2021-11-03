import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { Annotation, IAnnotation } from "react-image-annotation-ts";

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

const DisabledOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 2 !important;
  opacity: 0.5;
  background: grey;
`;

function ImageAnnotatorComponent(props: ImageAnnotatorComponentProps) {
  const {
    annotation,
    annotations,
    disabled,
    imageUrl,
    onChange,
    onReset,
    onSubmit,
  } = props;

  useEffect(() => {
    onReset();
  }, [imageUrl]);

  const handleChange = useCallback(
    (annotation: IAnnotation) => {
      onChange(annotation);
    },
    [onChange],
  );

  const handleSubmit = useCallback(
    (annotation: IAnnotation) => {
      onSubmit(annotation);
    },
    [onSubmit],
  );

  return (
    <ImageAnnotatorContainer>
      {disabled && <DisabledOverlay />}
      <Annotation
        annotations={annotations}
        onChange={handleChange}
        onSubmit={handleSubmit}
        src={imageUrl}
        value={annotation}
      />
    </ImageAnnotatorContainer>
  );
}

export interface ImageAnnotatorComponentProps {
  annotation: IAnnotation;
  annotations: IAnnotation[];
  disabled: boolean;
  imageUrl: string;
  onChange: (annotation: IAnnotation) => void;
  onReset: () => void;
  onSubmit: (annotation: IAnnotation) => void;
}

export default ImageAnnotatorComponent;
