import React from "react";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";

function ShowcaseCarouselModal({ children }: { children: React.ReactNode }) {
  return (
    <ModalComponent
      bottom={25}
      canEscapeKeyClose
      canOutsideClickClose
      data-cy={"help-modal"}
      hasBackDrop={false}
      isOpen
      onClose={() => {
        console.log("handle close");
      }}
      right={25}
      scrollContents
      width={325}
    >
      {children}
    </ModalComponent>
  );
}

export default ShowcaseCarouselModal;
