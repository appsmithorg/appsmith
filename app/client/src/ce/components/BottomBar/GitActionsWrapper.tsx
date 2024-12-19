// This function is used to wrap the children in a disabled container if the package is upgrading
// It's implemented in EE, but not in CE
function GitActionsWrapper({ children }: { children: React.ReactElement }) {
  return children;
}

export default GitActionsWrapper;
