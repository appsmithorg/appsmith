import React, { useState, useRef, useEffect } from "react";
import { updatePhoto, removePhoto } from "actions/userActions";
import { useDispatch } from "react-redux";

import DisplayImageUpload from "components/ads/DisplayImageUpload";

import UserApi from "api/UserApi";
import Uppy from "@uppy/core";

function FormDisplayImage() {
  const [file, setFile] = useState<any>();
  const [imageURL, setImageURL] = useState(`/api/${UserApi.photoURL}`);
  const dispatch = useDispatch();
  const dispatchActionRef = useRef<(uppy: Uppy.Uppy) => void | null>();

  const onUploadComplete = (uppy: Uppy.Uppy) => {
    uppy.reset();
    setImageURL(`/api/${UserApi.photoURL}?${new Date().getTime()}`);
  };

  const onSelectFile = (file: any) => {
    setFile(file.data);
  };

  useEffect(() => {
    dispatchActionRef.current = (uppy: Uppy.Uppy) => {
      dispatch(updatePhoto({ file, callback: () => onUploadComplete(uppy) }));
    };
  }, [file]);

  const upload = (uppy: Uppy.Uppy) => {
    if (typeof dispatchActionRef.current === "function")
      dispatchActionRef.current(uppy);
  };

  const removeProfileImage = () => {
    dispatch(
      removePhoto(() => {
        setImageURL(`/api/${UserApi.photoURL}?${new Date().getTime()}`);
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
