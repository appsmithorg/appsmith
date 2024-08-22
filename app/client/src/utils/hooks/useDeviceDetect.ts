import {
  DESKTOP_MIN_WIDTH,
  MOBILE_MAX_WIDTH,
  TABLET_MAX_WIDTH,
  TABLET_MIN_WIDTH,
} from "constants/AppConstants";
import { useMediaQuery } from "react-responsive";

export function useIsMobileDevice() {
  return useMediaQuery({ maxWidth: MOBILE_MAX_WIDTH });
}

export function useIsTabletDevice() {
  return useMediaQuery({
    minWidth: TABLET_MIN_WIDTH,
    maxWidth: TABLET_MAX_WIDTH,
  });
}

export function useIsDesktopDevice() {
  return useMediaQuery({
    minWidth: DESKTOP_MIN_WIDTH,
  });
}
