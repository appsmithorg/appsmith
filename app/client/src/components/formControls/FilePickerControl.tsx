import * as React from "react";
import { useState } from "react";
import styled from "styled-components";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import type { SetProgress } from "design-system-old";
import { FilePickerV2, FileType } from "design-system-old";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { useEffect, useCallback } from "react";
import { replayHighlightClass } from "globalStyles/portals";
import { Button, Modal, ModalBody, ModalContent } from "design-system";

const StyledDiv = styled.div`
  flex: 1;
  border: 1px solid var(--ads-v2-color-border);
  border-right: none;
  padding: 6px 12px;
  font-size: 14px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  border-radius: var(--ads-v2-border-radius) 0 0 var(--ads-v2-border-radius);
`;

const FilePickerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FilePickerContainer = styled.div`
  flex-direction: row;
  display: flex;
  width: 270px;
  .btn-select {
    border-radius: 0 var(--ads-v2-border-radius) var(--ads-v2-border-radius) 0 !important;
  }
`;
type RenderFilePickerProps = FilePickerControlProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  disabled?: boolean;
  onChange: (event: any) => void;
};

export function RenderFilePicker(props: RenderFilePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);

  // const changeOpenState = (state: boolean) => setIsOpen(state);
  const FileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
      } else {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);

  useEffect(() => {
    if (appFileToBeUploaded?.file) {
      const reader = new FileReader();
      reader.readAsDataURL(appFileToBeUploaded?.file);
      reader.onloadend = () => {
        const base64data = reader.result;
        props.input?.onChange({
          name: appFileToBeUploaded?.file.name,
          base64Content: base64data,
        });
      };
    }
    else {
      props.input?.onChange("");
    }
  }, [appFileToBeUploaded]);

  return (
    <>
      <FilePickerContainer className={replayHighlightClass}>
        <StyledDiv title={props?.input?.value?.name}>
          {props?.input?.value?.name}
        </StyledDiv>
        <Button
          className="btn-select"
          disabled={props.disabled}
          kind="secondary"
          onClick={() => {
            setIsOpen(true);
          }}
          size="md"
        >
          Select
        </Button>
      </FilePickerContainer>
      {isOpen ? (
        <Modal
          onOpenChange={() => {
            setIsOpen(false);
          }}
          open={isOpen}
        >
          <ModalContent style={{ width: "640px" }}>
            <ModalBody>
              <FilePickerWrapper>
                <FilePickerV2
                  delayedUpload
                  fileType={FileType.ANY}
                  fileUploader={FileUploader}
                  onFileRemoved={onRemoveFile}
                />
              </FilePickerWrapper>
            </ModalBody>
          </ModalContent>
        </Modal>
      ) : null}
    </>
  );
}
class FilePickerControl extends BaseControl<FilePickerControlProps> {
  constructor(props: FilePickerControlProps) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  render() {
    const { configProperty, disabled } = this.props;
    return (
      <Field
        component={RenderFilePicker}
        disabled={disabled}
        name={configProperty}
      />
    );
  }

  getControlType(): ControlType {
    return "FILE_PICKER";
  }
}

export interface FilePickerComponentState {
  isOpen: boolean;
}

export type FilePickerControlProps = ControlProps;

export default FilePickerControl;
