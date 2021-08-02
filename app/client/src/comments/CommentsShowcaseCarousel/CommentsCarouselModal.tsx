import React from "react";
import { Layers } from "constants/Layers";
import ModalComponent from "components/designSystems/appsmith/ModalComponent";
import { useDispatch } from "react-redux";
import { hideCommentsIntroCarousel } from "actions/commentActions";

function ShowcaseCarouselModal({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  return (
    <ModalComponent
      bottom={25}
      canEscapeKeyClose
      canOutsideClickClose
      data-cy={"help-modal"}
      hasBackDrop={false}
      isOpen
      left={25}
      onClose={() => {
        dispatch(hideCommentsIntroCarousel());
      }}
      overlayClassName="comments-onboarding-carousel"
      portalClassName="comments-onboarding-carousel-portal"
      scrollContents
      width={325}
      zIndex={Layers.appComments}
    >
      {children}
    </ModalComponent>
  );
}

export default ShowcaseCarouselModal;
