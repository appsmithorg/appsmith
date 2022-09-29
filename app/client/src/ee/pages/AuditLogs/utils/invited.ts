export function invited(invitees: string[]) {
  if (invitees.length === 1) {
    return `${invitees[0]} invited`;
  } else if (invitees.length > 1) {
    const u1 = invitees[0];
    const rest = invitees.length - 1;
    const userString = rest > 1 ? "users" : "user";
    return `${u1} and ${rest} more ${userString} invited`;
  } else {
    return `(No one was invited.)`;
  }
}
