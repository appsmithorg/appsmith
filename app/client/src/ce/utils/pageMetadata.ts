/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageTrackingMetadata } from "ee/entities/CustomerTracking";

// EE supplies additional page metadata. CE does not retain it.
export function getEditionPageMetadata(
  _page: PageTrackingMetadata,
): PageTrackingMetadata {
  return {};
}
