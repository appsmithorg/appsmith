import React from "react";

import { Modal } from "../Modal";
import { Tag } from "../Tag";
import { Text } from "../Text";
import {
  AnnouncementModalBannerClassName,
  AnnouncementModalClassName,
  AnnouncementModalContentClassName,
  AnnouncementModalContentDataClassName,
  AnnouncementModalContentFooterClassName,
} from "./AnnouncementModal.constants";
import {
  BannerContent,
  BannerData,
  BannerFooter,
  BannerImage,
  BannerTitle,
  StyledModalContent,
} from "./AnnouncementModal.styles";
import type { AnnouncementModalProps } from "./AnnouncementModal.types";

function AnnouncementModal({
  banner,
  description,
  footer,
  isBeta,
  isOpen,
  title,
}: AnnouncementModalProps) {
  return (
    <Modal open={isOpen}>
      <StyledModalContent className={AnnouncementModalClassName}>
        <BannerImage
          className={AnnouncementModalBannerClassName}
          url={banner}
        />
        <BannerContent className={AnnouncementModalContentClassName}>
          <BannerData className={AnnouncementModalContentDataClassName}>
            <BannerTitle>
              <Text kind="heading-m">{title}</Text>
              {isBeta ? (
                <Tag isClosable={false} size="md">
                  Beta
                </Tag>
              ) : null}
            </BannerTitle>
            <Text kind="body-m">{description}</Text>
          </BannerData>
          <BannerFooter className={AnnouncementModalContentFooterClassName}>
            {footer}
          </BannerFooter>
        </BannerContent>
      </StyledModalContent>
    </Modal>
  );
}

AnnouncementModal.displayName = "AnnouncementModal";

export { AnnouncementModal };
