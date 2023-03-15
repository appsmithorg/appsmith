// This file maintains variables whose value are different in CE and EE repo.
// EE will have a commit ahead of CE to apply its change

export const REPO = {
  CE: "CE",
  EE: "EE",
};

export const REPO_VARIABLES = {
  MySQL: 1,
  Mongo: 1,
  Edition: REPO.CE,
};
