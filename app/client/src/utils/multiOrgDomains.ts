const COOKIE_NAME = "appsmith_recent_domains";
const EXPIRY_DAYS = 30;
const MAX_DOMAINS = 10;

interface DomainEntry {
  domain: string;
  timestamp: number;
}

function getCurrentDomain(): string {
  return window.location.hostname;
}

function isValidAppsmithDomain(domain: string): boolean {
  return (
    domain.endsWith(".appsmith.com") &&
    !domain.startsWith("login.") &&
    !domain.startsWith("release.") &&
    !domain.startsWith("app.") &&
    !domain.startsWith("dev.")
  );
}

function isMultiOrgDomain(): boolean {
  const hostname = getCurrentDomain();

  return isValidAppsmithDomain(hostname);
}

function getStoredDomains(): DomainEntry[] {
  const cookieValue = getCookie(COOKIE_NAME);

  if (!cookieValue) return [];

  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch (e) {
    return [];
  }
}

function storeDomains(domains: DomainEntry[]): void {
  const expires = new Date();

  expires.setDate(expires.getDate() + EXPIRY_DAYS);

  const cookieValue = encodeURIComponent(JSON.stringify(domains));

  document.cookie = `${COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; domain=.appsmith.com; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }

  return null;
}

export function trackCurrentDomain(): void {
  if (!isMultiOrgDomain()) {
    return;
  }

  const currentDomain = getCurrentDomain();
  const currentTime = Date.now();

  let domains = getStoredDomains();

  domains = domains.filter((entry) => entry.domain !== currentDomain);

  domains.unshift({
    domain: currentDomain,
    timestamp: currentTime,
  });

  domains = domains.slice(0, MAX_DOMAINS);

  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;

  domains = domains.filter((entry) => entry.timestamp > thirtyDaysAgo);

  storeDomains(domains);
}

export function getRecentDomains(): string[] {
  const domains = getStoredDomains();

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return domains
    .filter((entry) => entry.timestamp > thirtyDaysAgo)
    .map((entry) => entry.domain)
    .filter((domain) => domain !== getCurrentDomain())
    .filter((domain) => isValidAppsmithDomain(domain));
}

export function clearRecentDomains(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.appsmith.com; path=/;`;
}

export { isValidAppsmithDomain };
