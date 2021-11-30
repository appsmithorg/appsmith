// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.
export const DOCUMENTVIEWER_WIDGET_CONSTANT = "";
// txt and pdf handle by viewerType = "url"
// and other types handle by viewerType = "office"
export const SUPPORTED_EXTENSIONS = [
  "txt",
  "pdf",
  "docx",
  "ppt",
  "pptx",
  "xlsx",
];

export const Renderers = {
  DOCUMENT_VIEWER: "DOCUMENT_VIEWER",
  DOCX_VIEWER: "DOCX_VIEWER",
  XLSX_VIEWER: "XLSX_VIEWER",
  ERROR: "ERROR",
};

export type Renderer = typeof Renderers[keyof typeof Renderers];

export type ViewerType = "google" | "office" | "mammoth" | "pdf" | "url";
