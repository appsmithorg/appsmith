export const getVideoConstraints = (
  prevConstraints: MediaTrackConstraints,
  isMobile: boolean,
  defaultCamera?: string,
  deviceId?: string,
) => {
  return {
    ...prevConstraints,
    ...(deviceId && { deviceId }),
    ...(isMobile && { facingMode: { ideal: defaultCamera } }),
  };
};
