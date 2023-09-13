import type { CalloutLinkProps } from "design-system";
import { Callout } from "design-system";
import React from "react";
import {
  PARTNER_PROGRAM_CALLOUT,
  createMessage,
} from "@appsmith/constants/messages";

type PartnerProgramCalloutProps = {
  email: string;
  onClose: () => void;
};

export default function PartnerProgramCallout(
  props: PartnerProgramCalloutProps,
) {
  const link: CalloutLinkProps = {
    children: "Learn about Appsmith Partner Program",
    to: "https://www.appsmith.com/partner-program",
    endIcon: "open",
  };

  return (
    <Callout
      data-testid="partner-program-callout"
      isClosable
      links={[link]}
      onClose={props.onClose}
    >
      {createMessage(PARTNER_PROGRAM_CALLOUT, props.email)}
    </Callout>
  );
}
