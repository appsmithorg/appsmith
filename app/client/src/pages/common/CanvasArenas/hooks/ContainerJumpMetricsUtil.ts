export const createThresholdTracker = () => {
  let containerJumpThreshold: {
    speed?: number;
    acceleration?: number;
  } = {};
  return {
    updateContainerJumpThresholdMetrics: (
      speed: number,
      acceleration: number,
    ) => {
      containerJumpThreshold = {
        speed,
        acceleration,
      };
    },
    getContainerJumpThresholdMetrics: () => {
      return {
        speed: containerJumpThreshold.speed,
        acceleration: containerJumpThreshold.acceleration,
      };
    },
    clearContainerJumpThresholdMetrics: () => {
      containerJumpThreshold = {};
    },
  };
};

export const createContainerJumpMetrics = () => {
  let containerJumpMetrics: {
    speed?: number;
    acceleration?: number;
    movingInto?: string;
  } = {};
  return {
    updateContainerJumpMetrics: (
      speed: number,
      acceleration: number,
      movingInto: string,
    ) => {
      containerJumpMetrics = {
        speed,
        acceleration,
        movingInto,
      };
    },
    getContainerJumpMetrics: () => {
      return {
        speed: containerJumpMetrics.speed,
        acceleration: containerJumpMetrics.acceleration,
        movingInto: containerJumpMetrics.movingInto,
      };
    },
    clearContainerJumpMetrics: () => {
      containerJumpMetrics = {};
    },
  };
};
