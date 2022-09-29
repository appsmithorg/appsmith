export type IconInfo = [/* iconName */ string, /* iconFillColor */ string];

export const EVENT_ICON_MAP: Record<string, IconInfo> = {
  cloned: ["duplicate", ""],
  copied: ["duplicate", ""],
  created: ["add-box-line", ""],
  deleted: ["delete", "#E32525"],
  deployed: ["rocket", ""],
  duplicated: ["duplicate", ""],
  executed: ["execute", ""],
  exported: ["download-line", ""],
  forked: ["fork-2", ""],
  imported: ["upload-line", ""],
  invited: ["mail-check-line", ""],
  logged_in: ["login", ""],
  logged_out: ["logout", ""],
  signed_up: ["user-follow-line", ""],
  updated: ["edit-box-line", ""],
  viewed: ["eye-on", ""],
};
