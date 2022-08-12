import React, { useState } from "react";
import { ComponentProps } from "widgets/BaseComponent";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/webcam/dist/style.css";
import { BaseButton } from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import Modal from "react-modal";
import { QrReader } from "react-qr-reader";
import { updateDatasource } from "actions/datasourceActions";
import { ViewFinder } from "./ViewFinder";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    zIndex: 2000,
    minHeight: "50%",
    width: "50%",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
};

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#root");
function FilePickerComponent(props: FilePickerComponentProps) {
  const [modalIsOpen, setIsOpen] = useState(false);

  /**
   * opens modal
   */
  const openModal = () => {
    setIsOpen(true);
    // props.uppy.getPlugin("Dashboard").openModal();
  };

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <BaseButton
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
        buttonColor={props.buttonColor}
        disabled={props.isDisabled}
        onClick={openModal}
        text={props.label}
      />

      <Modal
        isOpen={modalIsOpen}
        // onAfterOpen={afterOpenModal}
        // onRequestClose={closeModal}
        /* @ts-expect-error:error */
        style={customStyles}
        // contentLabel="Example Modal"
      >
        {modalIsOpen && (
          <QrReader
            ViewFinder={ViewFinder}
            constraints={{ facingMode: "user" }}
            onResult={(result, error) => {
              if (!!result) {
                setIsOpen(false);
                props.updateData(result.getText());
              }

              if (!!error) {
                console.info(error);
              }
            }}
          />
        )}
        <button onClick={closeModal}>close</button>

        {/* <p>{data}</p> */}
      </Modal>
    </>
  );
}
export interface FilePickerComponentProps extends ComponentProps {
  label: string;
  buttonColor: string;
  borderRadius: string;
  boxShadow?: string;
  updateData: (data: any) => void;
}

FilePickerComponent.defaultProps = {
  backgroundColor: Colors.GREEN,
};

export default FilePickerComponent;
