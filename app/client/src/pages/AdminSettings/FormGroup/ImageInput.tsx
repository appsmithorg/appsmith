import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { Button } from "@appsmith/ads";
import React, { memo, useRef, useState, useEffect } from "react";

import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";

import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";
import { ContentBox } from "../components";
import { getAssetUrl } from "ee/utils/airgapHelpers";

interface ImageInputProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?(value?: any): void;
  validate?(
    e: React.ChangeEvent<HTMLInputElement>,
    callback?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  ): void;
  className?: string;
  defaultValue?: string;
}
export const ImageInput = (props: ImageInputProps) => {
  const { className, defaultValue, onChange, validate, value } = props;
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // trigger file input on click of upload logo button
  const onFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // on upload, pass the blob to api
  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // validate the file, if invalid, show error
    // else call the callback
    validate &&
      validate(e, () => {
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onloadend = function () {
          setPreview(reader.result);
        };

        onChange && onChange(file);
      });
  };

  useEffect(() => {
    setPreview(null);
  }, [defaultValue]);

  return (
    <ContentBox
      className={`relative flex items-center justify-center w-full border h-28 group ${
        className ? className : ""
      }`}
    >
      <img
        alt="Preview"
        className="h-8"
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        src={getAssetUrl((preview as any) || value)}
      />
      <div className="absolute inset-0 items-center justify-center hidden gap-2 group-hover:flex bg-opacity-20 hover-state">
        <Button onClick={onFileInputClick} size="md" startIcon="upload-line">
          Upload file
        </Button>
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </ContentBox>
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

export function ImageInputComponent({ setting }: SettingComponentProps) {
  return (
    <FormGroup setting={setting}>
      <Field component={FieldImageInput()} name={setting.name} />
    </FormGroup>
  );
}

export default memo(ImageInputComponent);
