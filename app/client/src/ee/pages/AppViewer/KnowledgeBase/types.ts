export enum EKBProcessingStatus {
  IN_PROGRESS = "IN_PROGRESS",
  IDLE = "IDLE",
}

export interface TPageKB {
  processingStatus?: EKBProcessingStatus;
  pageSlug: string;
  intro: string;
  pageName: string;
  features: {
    name: string;
    description: string;
    steps: string[];
  }[];
}

export interface TApplicationKB {
  processingStatus: EKBProcessingStatus;
  applicationId: string;
  draftKb: {
    [key: string]: TPageKB;
  };
  publishedKB: {
    [key: string]: TPageKB;
  };
}

export interface BuilderKBViewProps {
  appKb: TApplicationKB | null;
  isLoading: boolean;
}

export interface KBPreviewProps {
  appKb: TApplicationKB;
  isKBGenerationPending: boolean;
  onPageSelect: (pageSlug: string) => void;
  selectedPage: string;
  showSuccessCallout: boolean;
}

export interface TKBResponse {
  applicationId: string;
  draftKb: {
    [key: string]: TPageKB;
  };
  publishedKB: {
    [key: string]: TPageKB;
  };
}

export interface KBDrawerBodyProps {
  appKb: TApplicationKB | null;
  isUserAppBuilder: boolean;
  onGenerateKB: () => void;
  currentPageSlug?: string;
  isLoading: boolean;
  showSuccessCallout: boolean;
}

export interface KBDrawerProps {
  currentPageSlug?: string;
  onClose: () => void;
  applicationKB: TApplicationKB | null;
  isUserAppBuilder: boolean;
  onGenerateKB: () => void;
  isLoading: boolean;
  hasRead: boolean;
}
