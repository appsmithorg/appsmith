import React from "react";
import { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { ReactComponent as ProfileImagePlaceholder } from "assets/images/profile-placeholder.svg";

import styled from "styled-components";

import { getTypographyByKey } from "constants/DefaultTheme";

type Props = {
  meta: Partial<WrappedFieldMetaProps>;
  input: Partial<WrappedFieldInputProps>;
  label?: string;
  id?: string;
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  & .input-component {
    display: none;
  }

  & .view {
    display: flex;
    flex-direction: column;
    align-items: center;

    .image-view {
      width: 80px;
      height: 80px;

      display: flex;
      justify-content: center;
      align-items: center;
      background-color: ${(props) =>
        props.theme.colors.displayImageUpload.background};
      border-radius: 50%;
      margin-bottom: ${(props) => props.theme.spaces[7]}px;
    }

    .label {
      ${(props) => getTypographyByKey(props, "h6")}
      color: ${(props) => props.theme.colors.displayImageUpload.label};
    }
  }
`;

const defaultLabel = "Upload Display Picture";

// WIP
export default function DisplayImageUpload({
  input: { onChange },
  label,
  id,
}: Props) {
  return (
    <Container>
      <label className="view" htmlFor={id}>
        <div className="image-view">
          <ProfileImagePlaceholder />
        </div>
        <input
          className="input-component"
          id={id}
          onChange={onChange}
          type="file"
        />
        <span className="label">{defaultLabel}</span>
      </label>
      <span>{label}</span>
    </Container>
  );
}
