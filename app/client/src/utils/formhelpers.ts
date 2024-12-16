export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 48;

export const hashPassword = (password: string) => {
  return password;
};

export const isEmptyString = (value: string) => {
  return !value || value.trim().length === 0 || false;
};

export const isStrongPassword = (value: string) => {
  const passwordLength = value.trim().length;

  return (
    passwordLength >= PASSWORD_MIN_LENGTH &&
    passwordLength <= PASSWORD_MAX_LENGTH
  );
};

export const noSpaces = (value: string) => {
  return !value || value.trim().length === 0;
};

// TODO (abhinav): Use a regex which adheres to standards RFC5322
export const isEmail = (value: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return re.test(value);
};

export function isRelevantEmail(email: string) {
  const GENERAL_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "aol.com",
    "icloud.com",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
  ];

  // Extract the domain from the email
  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain) {
    return false;
  }

  // Check if the domain exists in the list of general domains
  return !GENERAL_DOMAINS.includes(domain);
}
