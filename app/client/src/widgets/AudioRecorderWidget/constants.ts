export enum BlobContentTypes {
  RAW_BINARY = "RAW_BINARY",
  DATA_URL = "DATA_URL",
  TEXT = "TEXT",
}

export type BlobContent = keyof typeof BlobContentTypes;
