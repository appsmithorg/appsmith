// The lock and audit entity of one page. Every layout write (commitLayout), every page-metadata and event mutation,
// and every widget-removal confirmation uses it, so it has one definition. Edition tools that write a page use it too.
export function pageEntityKey(applicationId: string, pageId: string): string {
  return `page:${applicationId}:${pageId}`;
}
