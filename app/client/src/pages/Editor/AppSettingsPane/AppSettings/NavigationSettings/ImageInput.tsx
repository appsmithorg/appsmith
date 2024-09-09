import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import classNames from "classnames";
import { Button, Spinner } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import {
  getIsDeletingNavigationLogo,
  getIsUploadingNavigationLogo,
} from "ee/selectors/applicationSelectors";
import { ContentBox } from "pages/AdminSettings/components";

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
          <Spinner size="lg" />
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
    <ContentBox
      className={`relative flex items-center justify-center w-full border h-28 group ${
        className ? className : ""
      }`}
    >
      {renderLogo()}

      <div className="absolute inset-0 items-center justify-center hidden gap-2 group-hover:flex bg-opacity-20 hover-state">
        <Button onClick={onFileInputClick} size="md" startIcon="upload-line">
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
    </ContentBox>
  );
};

export default ImageInput;
