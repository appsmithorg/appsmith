export const getCurrentDateISO = (): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 19) + "+05:30";
  };
  