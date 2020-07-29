const PASSWORD_MIN_LENGTH = 6;

export const hashPassword = (password: string) => {
  return password;
};

export const isEmptyString = (value: string) => {
  return !value || value.trim().length === 0 || typeof value !== "string";
};

export const isStrongPassword = (value: string) => {
  return value.trim().length >= PASSWORD_MIN_LENGTH;
};

// TODO (abhinav): Use a regex which adheres to standards RFC5322
export const isEmail = (value: string) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(value);
};
