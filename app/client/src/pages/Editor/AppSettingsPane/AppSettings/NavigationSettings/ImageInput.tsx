import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Button, Size, Spinner } from "design-system-old";
import React, { memo, useRef } from "react";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { useSelector } from "react-redux";
import { getIsUploadingNavigationLogo } from "@appsmith/selectors/applicationSelectors";
import styled from "styled-components";

type ImageInputProps = {
  value?: any;
  onChange?(value?: any): void;
  validate?(
    e: React.ChangeEvent<HTMLInputElement>,
    callback?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  ): void;
  className?: string;
  defaultValue?: string;
};

const StyledImg = styled.img`
  object-fit: contain;
  max-width: 200px;
  max-height: 100px;
`;

export const ImageInput = (props: ImageInputProps) => {
  const { className, onChange, validate, value } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadingNavigationLogo = useSelector(getIsUploadingNavigationLogo);

  // trigger file input on click of upload logo button
  const onFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // on upload, pass the file to api
  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // validate the file, if invalid, show error
    // else call the callback
    validate &&
      validate(e, () => {
        onChange && onChange(file);
      });
  };

  return (
    <div
      className={`relative flex items-center justify-center w-full border h-28 group ${
        className ? className : ""
      }`}
    >
      {isUploadingNavigationLogo ? (
        <div className="px-4 py-10 w-full flex justify-center">
          <Spinner size="extraExtraExtraExtraLarge" />
        </div>
      ) : value ? (
        <StyledImg
          alt="Your application's logo"
          src={`/api/v1/assets/${value}`}
        />
      ) : (
        "No logo set"
      )}

      <div className="absolute inset-0 items-center justify-center hidden gap-2 bg-black group-hover:flex bg-opacity-20">
        <Button
          icon="upload-line"
          iconPosition="left"
          onClick={onFileInputClick}
          size={Size.medium}
          text="Upload"
        >
          Upload
        </Button>
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
};

function FieldImageInput() {
  return function FieldCheckbox(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    return <ImageInput value={componentProps.input.value} />;
  };
}

export default memo(FieldImageInput());
