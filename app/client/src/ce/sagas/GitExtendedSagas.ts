export function* updateGitDefaultBranchSaga() {}

// export function* fetchGitProtectedBranchesSaga() {
//   const branches: Branch[] = yield select(getGitBranches);
//   const defaultBranch = branches.find((b) => b.default);
//   if (defaultBranch) {
//     yield put({
//       type: ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_SUCCESS,
//       payload: { protectedBranches: [defaultBranch.branchName] },
//     });
//   }
// }

// export function* updateGitProtectedBranchesSaga() {}
