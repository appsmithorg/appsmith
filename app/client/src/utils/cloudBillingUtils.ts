export function isLoginHostname(): boolean {
  const hostname = window.location.hostname;

  return hostname.split(".")[0] === "login";
}
