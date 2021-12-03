import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updatePhoto, removePhoto, updatePhotoId } from "actions/userActions";
import { getCurrentUser } from "selectors/usersSelectors";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import DisplayImageUpload from "components/ads/DisplayImageUpload";

import Uppy from "@uppy/core";

function FormDisplayImage() {
  const [file, setFile] = useState<any>();
  const dispatch = useDispatch();
  const user = useSelector(getCurrentUser);
  const dispatchActionRef = useRef<(uppy: Uppy.Uppy) => void | null>();

  const imageURL = user?.photoId
    ? `/api/${USER_PHOTO_ASSET_URL}/${user?.photoId}`
    : "";

  const onUploadComplete = (uppy: Uppy.Uppy, photoId: string) => {
    uppy.reset();
    dispatch(updatePhotoId({ photoId }));
  };

  const onSelectFile = (file: any) => {
    setFile(file.data);
  };

  useEffect(() => {
    dispatchActionRef.current = (uppy: Uppy.Uppy) => {
      dispatch(
        updatePhoto({
          file,
          callback: (photoId: string) => onUploadComplete(uppy, photoId),
        }),
      );
    };
  }, [file]);

  const upload = (uppy: Uppy.Uppy) => {
    if (typeof dispatchActionRef.current === "function")
      dispatchActionRef.current(uppy);
  };

  const removeProfileImage = () => {
    dispatch(
      removePhoto((photoId: string) => {
        dispatch(updatePhotoId({ photoId }));
      }),
    );
  };

  return (
    <DisplayImageUpload
      onChange={onSelectFile}
      onRemove={removeProfileImage}
      submit={upload}
      value={imageURL}
    />
  );
}

export default FormDisplayImage;
