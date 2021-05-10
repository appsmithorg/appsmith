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
    cursor: pointer;
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

      img {
        height: 100%;
        width: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
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
  input: { onChange, value },
  label,
  id,
}: Props) {
  const _onChange = (e: any) => {
    e.preventDefault();
    const reader = new FileReader();
    const file = e.target.files[0];
    reader.onloadend = () => {
      if (onChange) {
        onChange({
          file: file,
          imagePreview: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Container>
      <label className="view" htmlFor={id}>
        <div className="image-view">
          {!value?.imagePreview ? (
            <ProfileImagePlaceholder />
          ) : (
            <img src={value?.imagePreview} />
          )}
        </div>
        <input
          className="input-component"
          id={id}
          onChange={_onChange}
          type="file"
        />
        {!value?.imagePreview && <span className="label">{defaultLabel}</span>}
      </label>
    </Container>
  );
}
