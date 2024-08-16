import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updatePhoto, removePhoto, updatePhotoId } from "actions/userActions";
import { getCurrentUser } from "selectors/usersSelectors";
import { USER_PHOTO_ASSET_URL } from "constants/userConstants";
import { DisplayImageUpload } from "@appsmith/ads-old";

import type Uppy from "@uppy/core";
import { ReduxActionErrorTypes } from "ee/constants/ReduxActionConstants";
import type { ErrorActionPayload } from "sagas/ErrorSagas";
import { USER_DISPLAY_PICTURE_FILE_INVALID } from "ee/constants/messages";

function FormDisplayImage() {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const onFileTypeInvalid = () => {
    const payload: ErrorActionPayload = {
      show: true,
      error: {
        message: USER_DISPLAY_PICTURE_FILE_INVALID(),
      },
    };
    dispatch({
      type: ReduxActionErrorTypes.USER_IMAGE_INVALID_FILE_CONTENT,
      payload,
    });
  };

  return (
    <DisplayImageUpload
      onChange={onSelectFile}
      onInvalidFileContent={onFileTypeInvalid}
      onRemove={removeProfileImage}
      submit={upload}
      value={imageURL}
    />
  );
}

export default FormDisplayImage;
