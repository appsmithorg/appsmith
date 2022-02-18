import { useMediaQuery } from "react-responsive";
import {
  MOBILE_MAX_WIDTH,
  TABLET_MIN_WIDTH,
  TABLET_MAX_WIDTH,
  DESKTOP_MIN_WIDTH,
} from "constants/AppConstants";

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
