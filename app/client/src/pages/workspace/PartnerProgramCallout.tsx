import type { CalloutLinkProps } from "@appsmith/ads";
import { Callout } from "@appsmith/ads";
import React from "react";
import {
  PARTNER_PROGRAM_CALLOUT,
  PARTNER_PROGRAM_CALLOUT_LINK,
  createMessage,
} from "ee/constants/messages";

interface PartnerProgramCalloutProps {
  email: string;
  onClose: () => void;
}

export default function PartnerProgramCallout(
  props: PartnerProgramCalloutProps,
) {
  const links: CalloutLinkProps[] = [
    {
      children: createMessage(PARTNER_PROGRAM_CALLOUT_LINK),
      to: "https://www.appsmith.com/partner-program",
      endIcon: "share-box-line",
    },
  ];

  return (
    <Callout
      data-testid="partner-program-callout"
      isClosable
      links={links}
      onClose={props.onClose}
    >
      {createMessage(PARTNER_PROGRAM_CALLOUT, props.email)}
    </Callout>
  );
}
