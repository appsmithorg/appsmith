import AclApi, {
  FetchSingleDataPayload,
  GroupResponse,
  RoleResponse,
  UpdateGroupsInUserRequestPayload,
  UpdateRolesInGroupRequestPayload,
  UpdateRolesInUserRequestPayload,
} from "@appsmith/api/AclApi";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { takeLatest, all, call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import { ApiResponse } from "api/ApiResponses";
import { User } from "constants/userConstants";
import { RoleProps } from "@appsmith/pages/AdminSettings/AccessControl/types";
import history from "utils/history";
import { INVITE_USERS_TAB_ID } from "@appsmith/pages/AdminSettings/AccessControl/components";
import log from "loglevel";
import { Toaster, Variant } from "design-system-old";
import {
  createMessage,
  ACL_DELETED_SUCCESS,
  EVENT_GROUP_ROLES_TAB,
  EVENT_USER_GROUPS_TAB,
  EVENT_USER_ROLES_TAB,
  SUCCESSFULLY_SAVED,
} from "@appsmith/constants/messages";
import { showAdminSettings } from "@appsmith/utils/adminSettingsHelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "actions/authActions";

export function* fetchAclUsersSaga() {
  try {
    const response: ApiResponse = yield call(AclApi.fetchAclUsers);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USERS_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ACL_USERS_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACL_USERS_ERROR,
    });
  }
}

export function* deleteAclUserSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.deleteAclUser(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_USER_SUCCESS,
        payload: {
          data: response.data,
          id: action.payload.id,
        },
      });
      Toaster.show({
        text: "User deleted successfully",
        variant: Variant.success,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.DELETE_ACL_USER_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACL_USER_ERROR,
    });
  }
}

export function* fetchAclUserByIdSaga(
  action: ReduxAction<
    FetchSingleDataPayload & {
      triggerUpdateEvent?: boolean;
      updatePayload?: any;
    }
  >,
) {
  try {
    const response: ApiResponse[] = yield all([
      AclApi.fetchSingleAclUser(action.payload),
      AclApi.fetchRolesForInvite(),
      AclApi.fetchGroupsForInvite(),
    ]);

    if (
      !response[0]?.responseMeta?.success &&
      response[0]?.responseMeta?.status === 403 &&
      response[0]?.responseMeta?.error?.message === "Unauthorized access"
    ) {
      history.push(`/applications`);
      yield put(getCurrentUser());
      return;
    }

    const isValidResponse1: boolean = yield validateResponse(response[0]);

    if (isValidResponse1) {
      const data: any = response[0].data;
      if (action.payload.triggerUpdateEvent && action.payload.updatePayload) {
        if (action.payload.updatePayload.tab === "roles") {
          AnalyticsUtil.logEvent("GAC_USER_ROLE_UPDATE", {
            origin: createMessage(EVENT_USER_ROLES_TAB),
            email: data.username,
            rolesAdded: action.payload.updatePayload.rolesAdded,
            rolesRemoved: action.payload.updatePayload.rolesRemoved,
            roles: data.roles,
          });
        }

        if (action.payload.updatePayload.tab === "groups") {
          AnalyticsUtil.logEvent("GAC_USER_GROUP_UPDATE", {
            origin: createMessage(EVENT_USER_GROUPS_TAB),
            email: data.username,
            groupsAdded: action.payload.updatePayload.groupsAdded,
            groupsRemoved: action.payload.updatePayload.groupsRemoved,
            groups: data.groups,
          });
        }
      }
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USER_BY_ID_SUCCESS,
        payload: {
          ...data,
          allRoles: Array.isArray(response[1]?.data)
            ? response[1]?.data?.filter((all) => {
                return data?.roles?.length > 0
                  ? data?.roles?.every((active: any) => {
                      return active.id !== all.id;
                    })
                  : true;
              })
            : [],
          allGroups: Array.isArray(response[2]?.data)
            ? response[2]?.data?.filter((all) => {
                return data?.groups?.length > 0
                  ? data?.groups?.every((active: any) => {
                      return active.id !== all.id;
                    })
                  : true;
              })
            : [],
        },
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ACL_USER_BY_ID_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACL_USER_BY_ID_ERROR,
    });
  }
}

export function* updateGroupsInUserSaga(
  action: ReduxAction<UpdateGroupsInUserRequestPayload>,
) {
  try {
    const response: ApiResponse = yield AclApi.updateGroupsInUser(
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_GROUPS_IN_USER_SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USER_BY_ID,
        payload: {
          id: action.payload.userId || "",
          triggerUpdateEvent: true,
          updatePayload: {
            ...action.payload,
            tab: "groups",
          },
        },
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_GROUPS_IN_USER_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.UPDATE_GROUPS_IN_USER_ERROR,
    });
  }
}

export function* updateRolesInUserSaga(
  action: ReduxAction<UpdateRolesInUserRequestPayload>,
) {
  try {
    const response: ApiResponse = yield AclApi.updateRolesInUser(
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_ROLES_IN_USER_SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USER_BY_ID,
        payload: {
          id: action.payload?.users[0]?.id || "",
          triggerUpdateEvent: true,
          updatePayload: {
            ...action.payload,
            tab: "roles",
          },
        },
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_ROLES_IN_USER_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ROLES_IN_USER_ERROR,
    });
  }
}

export function* fetchAclGroupsSaga() {
  try {
    const response: ApiResponse = yield call(AclApi.fetchAclGroups);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_GROUPS_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ACL_GROUPS_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACL_GROUPS_ERROR,
    });
  }
}

export function* fetchAclGroupSagaById(
  action: ReduxAction<
    FetchSingleDataPayload & {
      triggerUpdateEvent?: boolean;
      updatePayload?: any;
    }
  >,
) {
  try {
    const response: ApiResponse[] = yield all([
      AclApi.fetchSingleAclGroup(action.payload),
      AclApi.fetchRolesForInvite(),
    ]);

    const isValidResponse1: boolean = yield validateResponse(response[0]);

    if (isValidResponse1) {
      const data: any = response[0].data;
      if (action.payload.triggerUpdateEvent && action.payload.updatePayload) {
        AnalyticsUtil.logEvent("GAC_GROUP_ROLE_UPDATE", {
          origin: createMessage(EVENT_GROUP_ROLES_TAB),
          name: data.name,
          rolesAdded: action.payload.updatePayload.rolesAdded,
          rolesRemoved: action.payload.updatePayload.rolesRemoved,
          roles: data.roles,
        });
      }
      yield put({
        type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID_SUCCESS,
        payload: {
          ...data,
          allRoles: Array.isArray(response[1]?.data)
            ? response[1]?.data?.filter((all) => {
                return data?.roles?.length > 0
                  ? data?.roles?.every((active: any) => {
                      return active.id !== all.id;
                    })
                  : true;
              })
            : [],
        },
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ACL_GROUP_BY_ID_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACL_GROUP_BY_ID_ERROR,
    });
  }
}

export function* createAclGroupSaga(action: ReduxAction<any>) {
  try {
    const response: [GroupResponse, ApiResponse] = yield all([
      AclApi.createAclGroup(action.payload),
      AclApi.fetchRolesForInvite(),
    ]);

    const isValidResponse1: boolean = yield validateResponse(response[0]);

    if (isValidResponse1) {
      const data: any = response[0].data;
      yield put({
        type: ReduxActionTypes.CREATE_ACL_GROUP_SUCCESS,
        payload: {
          ...data,
          allRoles: Array.isArray(response[1]?.data)
            ? response[1]?.data?.filter((all) => {
                return data?.roles?.length > 0
                  ? data?.roles?.every((active: any) => {
                      return active.id !== all.id;
                    })
                  : true;
              })
            : [],
        },
      });
      const role: RoleProps = {
        ...data,
        id: data.id,
        name: data.name,
      };
      history.push(`/settings/groups/${role.id}`);
    } else {
      yield put({
        type: ReduxActionErrorTypes.CREATE_ACL_GROUP_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACL_GROUP_ERROR,
    });
  }
}

export function* deleteAclGroupSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.deleteAclGroup(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_GROUP_SUCCESS,
        payload: response.data,
      });
      Toaster.show({
        text: createMessage(ACL_DELETED_SUCCESS),
        variant: Variant.success,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.DELETE_ACL_GROUP_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACL_GROUP_ERROR,
    });
  }
}

export function* cloneGroupSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.cloneAclGroup(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CLONE_ACL_GROUP_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.CLONE_ACL_GROUP_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.CLONE_ACL_GROUP_ERROR,
    });
  }
}

export function* updateGroupNameSaga(action: ReduxAction<any>) {
  try {
    const response: GroupResponse = yield AclApi.updateAclGroupName(
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_ACL_GROUP_NAME_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_ACL_GROUP_NAME_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACL_GROUP_NAME_ERROR,
    });
  }
}

export function* updateRolesInGroupSaga(
  action: ReduxAction<UpdateRolesInGroupRequestPayload>,
) {
  try {
    const response: ApiResponse = yield AclApi.updateRolesInGroup(
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_ACL_GROUP_ROLES_SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID,
        payload: {
          id: action.payload?.groups[0]?.id || "",
          triggerUpdateEvent: true,
          updatePayload: action.payload,
        },
      });
      Toaster.show({
        text: createMessage(SUCCESSFULLY_SAVED),
        variant: Variant.success,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_ACL_GROUP_ROLES_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACL_GROUP_ROLES_ERROR,
    });
  }
}

export function* addUsersInGroupSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.addUsersInSelectedGroup(
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.ADD_USERS_IN_GROUP_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.ADD_USERS_IN_GROUP_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.ADD_USERS_IN_GROUP_ERROR,
    });
  }
}

export function* removeUsersFromGroupSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.removeUsersFromSelectedGroup(
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.REMOVE_USERS_FROM_GROUP_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.REMOVE_USERS_FROM_GROUP_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.REMOVE_USERS_FROM_GROUP_ERROR,
    });
  }
}

export function* fetchAclRolesSaga() {
  try {
    const response: ApiResponse = yield call(AclApi.fetchAclRoles);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_ROLES_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ACL_ROLES_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACL_ROLES_ERROR,
    });
  }
}

export function* fetchAclRoleSagaById(
  action: ReduxAction<FetchSingleDataPayload>,
) {
  try {
    const response: ApiResponse = yield AclApi.fetchSingleRole(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_ROLE_BY_ID_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ACL_ROLE_BY_ID_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACL_ROLE_BY_ID_ERROR,
    });
  }
}

export function* updateRoleNameSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.updateAclRoleName(
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_ACL_ROLE_NAME_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_ACL_ROLE_NAME_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACL_ROLE_NAME_ERROR,
    });
  }
}

export function* updateRoleSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.updateAclRole(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_ACL_ROLE_SUCCESS,
        payload: response.data,
      });
      Toaster.show({
        text: createMessage(SUCCESSFULLY_SAVED),
        variant: Variant.success,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_ACL_ROLE_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACL_ROLE_ERROR,
    });
  }
}

export function* createAclRoleSaga(action: ReduxAction<any>) {
  try {
    const response: RoleResponse = yield AclApi.createAclRole(action.payload);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_ACL_ROLE_SUCCESS,
        payload: response.data,
      });
      const role: RoleProps = {
        ...response.data,
        id: response.data.id,
        name: response.data.name,
      };
      history.push(`/settings/roles/${role.id}`);
    } else {
      yield put({
        type: ReduxActionErrorTypes.CREATE_ACL_ROLE_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACL_ROLE_ERROR,
    });
  }
}

export function* deleteAclRoleSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.deleteAclRole(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_ROLE_SUCCESS,
        payload: response.data,
      });
      Toaster.show({
        text: createMessage(ACL_DELETED_SUCCESS),
        variant: Variant.success,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.DELETE_ACL_ROLE_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACL_ROLE_ERROR,
    });
  }
}

export function* cloneRoleSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.cloneAclRole(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CLONE_ACL_ROLE_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.CLONE_ACL_ROLE_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.CLONE_ACL_ROLE_ERROR,
    });
  }
}

export function* fetchRolesGroupsForInviteSaga() {
  try {
    const response: ApiResponse[] = yield all([
      AclApi.fetchRolesForInvite(),
      AclApi.fetchGroupsForInvite(),
    ]);

    const isValidResponse1: boolean = yield validateResponse(response[0]);
    const isValidResponse2: boolean = yield validateResponse(response[1]);

    if (isValidResponse1 && isValidResponse2) {
      yield put({
        type: ReduxActionTypes.FETCH_ROLES_GROUPS_FOR_INVITE_SUCCESS,
        payload: {
          roles: response[0].data,
          groups: response[1].data,
        },
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ROLES_GROUPS_FOR_INVITE_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ROLES_GROUPS_FOR_INVITE_ERROR,
    });
  }
}

export function* createAclUserSaga(action: ReduxAction<any>) {
  try {
    const { via, ...request } = action.payload;
    const response: ApiResponse =
      via === INVITE_USERS_TAB_ID.VIA_GROUPS
        ? yield AclApi.inviteUsersViaGroups(request)
        : yield AclApi.inviteUsersViaRoles(request);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_ACL_USER_SUCCESS,
      });
      if (response.data) {
        yield put({
          type: ReduxActionTypes.FETCH_ACL_USERS,
        });
      }
    } else {
      yield put({
        type: ReduxActionErrorTypes.CREATE_ACL_USER_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACL_USER_ERROR,
    });
  }
}

export function* fetchIconLocationsSagas() {
  try {
    const response: ApiResponse = yield AclApi.fetchIconLocation();

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ICON_LOCATIONS_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ICON_LOCATIONS_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ICON_LOCATIONS_ERROR,
    });
  }
}

export function* InitAclSaga(action: ReduxAction<User>) {
  const user = action.payload;
  if (showAdminSettings(user)) {
    yield all([
      takeLatest(ReduxActionTypes.CREATE_ACL_USER, createAclUserSaga),
      takeLatest(ReduxActionTypes.DELETE_ACL_USER, deleteAclUserSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_USERS, fetchAclUsersSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_USER_BY_ID, fetchAclUserByIdSaga),
      takeLatest(
        ReduxActionTypes.UPDATE_GROUPS_IN_USER,
        updateGroupsInUserSaga,
      ),
      takeLatest(ReduxActionTypes.UPDATE_ROLES_IN_USER, updateRolesInUserSaga),
      takeLatest(ReduxActionTypes.CREATE_ACL_GROUP, createAclGroupSaga),
      takeLatest(ReduxActionTypes.DELETE_ACL_GROUP, deleteAclGroupSaga),
      takeLatest(ReduxActionTypes.CLONE_ACL_GROUP, cloneGroupSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_GROUPS, fetchAclGroupsSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_GROUP_BY_ID, fetchAclGroupSagaById),
      takeLatest(ReduxActionTypes.UPDATE_ACL_GROUP_NAME, updateGroupNameSaga),
      takeLatest(
        ReduxActionTypes.UPDATE_ACL_GROUP_ROLES,
        updateRolesInGroupSaga,
      ),
      takeLatest(ReduxActionTypes.ADD_USERS_IN_GROUP, addUsersInGroupSaga),
      takeLatest(
        ReduxActionTypes.REMOVE_USERS_FROM_GROUP,
        removeUsersFromGroupSaga,
      ),
      takeLatest(ReduxActionTypes.CREATE_ACL_ROLE, createAclRoleSaga),
      takeLatest(ReduxActionTypes.DELETE_ACL_ROLE, deleteAclRoleSaga),
      takeLatest(ReduxActionTypes.CLONE_ACL_ROLE, cloneRoleSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_ROLES, fetchAclRolesSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_ROLE_BY_ID, fetchAclRoleSagaById),
      takeLatest(ReduxActionTypes.UPDATE_ACL_ROLE_NAME, updateRoleNameSaga),
      takeLatest(ReduxActionTypes.UPDATE_ACL_ROLE, updateRoleSaga),
      takeLatest(
        ReduxActionTypes.FETCH_ROLES_GROUPS_FOR_INVITE,
        fetchRolesGroupsForInviteSaga,
      ),
      takeLatest(
        ReduxActionTypes.FETCH_ICON_LOCATIONS,
        fetchIconLocationsSagas,
      ),
    ]);
  }
}

export default function* AclSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS, InitAclSaga);
}
