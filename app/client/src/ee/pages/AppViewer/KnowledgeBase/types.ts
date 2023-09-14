export enum EKBProcessingStatus {
  IN_PROGRESS = "IN_PROGRESS",
  IDLE = "IDLE",
}

export type TPageKB = {
  processingStatus?: EKBProcessingStatus;
  pageSlug: string;
  intro: string;
  pageName: string;
  features: {
    name: string;
    description: string;
    steps: string[];
  }[];
};

export type TApplicationKB = {
  processingStatus: EKBProcessingStatus;
  applicationId: string;
  draftKb: {
    [key: string]: TPageKB;
  };
  publishedKB: {
    [key: string]: TPageKB;
  };
};

export type BuilderKBViewProps = {
  appKb: TApplicationKB | null;
  isLoading: boolean;
};

export type KBPreviewProps = {
  appKb: TApplicationKB;
  isKBGenerationPending: boolean;
  onPageSelect: (pageSlug: string) => void;
  selectedPage: string;
  showSuccessCallout: boolean;
};

export type TKBResponse = {
  applicationId: string;
  draftKb: {
    [key: string]: TPageKB;
  };
  publishedKB: {
    [key: string]: TPageKB;
  };
};

export type KBDrawerBodyProps = {
  appKb: TApplicationKB | null;
  isUserAppBuilder: boolean;
  onGenerateKB: () => void;
  currentPageSlug?: string;
  isLoading: boolean;
  showSuccessCallout: boolean;
};

export type KBDrawerProps = {
  currentPageSlug?: string;
  onClose: () => void;
  size: string;
  applicationKB: TApplicationKB | null;
  isUserAppBuilder: boolean;
  onGenerateKB: () => void;
  isLoading: boolean;
};
