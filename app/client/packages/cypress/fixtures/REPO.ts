export const REPO = {
  CE: "CE",
  EE: "EE",
};
// CURRENT_REPO value is set as "CE" in appsmith repo and "EE" in appsmith-ee repo.
// appsmith-ee has a commit ahead of CE to persist the change.
// This file should not be modified to avoid the conflict when ce code merged to ee.
export const CURRENT_REPO = REPO.CE;
