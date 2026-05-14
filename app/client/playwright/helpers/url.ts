interface AppPageUrlOptions {
  pageId: string;
  branch?: string;
  appSlug?: string;
  pageSlug?: string;
}

function buildUrl(opts: AppPageUrlOptions, mode: "edit" | "view"): string {
  const appSegment = opts.appSlug ?? "application";
  const pageSegment = opts.pageSlug
    ? `${opts.pageSlug}-${opts.pageId}`
    : `page-${opts.pageId}`;
  const base = `/app/${appSegment}/${pageSegment}`;
  const path = mode === "edit" ? `${base}/edit` : `${base}/view`;
  return opts.branch ? `${path}?branch=${opts.branch}` : path;
}

export function editorUrl(opts: AppPageUrlOptions): string {
  return buildUrl(opts, "edit");
}

export function viewUrl(opts: AppPageUrlOptions): string {
  return buildUrl(opts, "view");
}
