import { Button, Size, Spinner } from "design-system-old";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  getIsDeletingNavigationLogo,
  getIsUploadingNavigationLogo,
} from "@appsmith/selectors/applicationSelectors";
import styled from "styled-components";
import classNames from "classnames";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

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
  const isDeletingNavigationLogo = useSelector(getIsDeletingNavigationLogo);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);

  // trigger file input on click of upload logo button
  const onFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // on upload, pass the file to api
  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLogoLoaded(false);

    const file = e.target.files?.[0];

    if (!file) return;

    // validate the file, if invalid, show error
    // else call the callback
    validate &&
      validate(e, () => {
        onChange && onChange(file);
      });
  };

  useEffect(() => {
    if (isDeletingNavigationLogo) {
      setIsLogoLoaded(false);

      // reset the input to accept the same file again if delete happens
      if (fileInputRef?.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isDeletingNavigationLogo]);

  const renderLogo = () => {
    if (isUploadingNavigationLogo || isDeletingNavigationLogo) {
      return (
        <div className="px-4 py-10 w-full flex justify-center">
          <Spinner size="extraExtraExtraExtraLarge" />
        </div>
      );
    }

    if (value) {
      return (
        <StyledImg
          alt="Your application's logo"
          className={classNames({
            hidden: !isLogoLoaded,
          })}
          onLoad={() => setIsLogoLoaded(true)}
          src={getAssetUrl(value)}
        />
      );
    } else {
      return "No logo set";
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center w-full border h-28 group ${
        className ? className : ""
      }`}
    >
      {renderLogo()}

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
        accept="image/jpeg, image/png"
        className="hidden"
        onChange={onFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
};

export default ImageInput;
