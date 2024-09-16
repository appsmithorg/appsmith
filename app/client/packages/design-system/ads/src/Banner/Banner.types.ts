import type { CalloutLinkProps, CalloutProps } from "../Callout";

// Banner props
export type BannerProps = Omit<CalloutProps, "links" | "_componentType"> & {
  link?: CalloutLinkProps;
};
