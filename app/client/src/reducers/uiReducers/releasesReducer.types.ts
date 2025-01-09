export interface ReleasesState {
  newReleasesCount: number;
  releaseItems: Array<any>; // TODO: Add proper type for release items
  hasStartedFetching: boolean;
  hasFetchedReleases: boolean;
}
