// AnnouncementModal props
export interface AnnouncementModalProps {
  /** flag to show or hide modal  */
  isOpen: boolean;
  /** the banner url of the announcement */
  banner: string;
  /** the title of the announcement */
  title: string;
  /** the description of the announcement */
  description: string;
  /** the footer of the announcement */
  footer?: React.ReactNode;
  /** flag to show or hide beta flag  */
  isBeta?: boolean;
}
