import type { CalloutLinkProps } from "design-system";
import { Callout } from "design-system";
import React from "react";
import {
  PARTNER_PROGRAM_CALLOUT,
  PARTNER_PROGRAM_CALLOUT_LINK,
  createMessage,
} from "@appsmith/constants/messages";

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
