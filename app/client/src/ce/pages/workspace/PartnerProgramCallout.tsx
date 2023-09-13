import type { CalloutLinkProps } from "design-system";
import { Callout } from "design-system";
import React from "react";

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
    <Callout isClosable links={[link]} onClose={props.onClose}>
      {props.email} is outside your organisation. If you’re building this app
      for someone else, you should check out our partner program.
    </Callout>
  );
}
