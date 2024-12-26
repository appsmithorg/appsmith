export interface SearchAndAddProps {
  /** Placeholder text for search input. */
  placeholder?: string;
  /** Value for search input in controlled mode.  */
  searchTerm?: string;
  /** Callback to be called when add button is clicked. */
  onAdd?: () => void;
  /** Callback to be called when search input value changes. */
  onSearch?: (searchTerm: string) => void;
  /** Whether to show the add button. Allows to hide the button for users with insufficient access privileges. */
  showAddButton: boolean;
}
