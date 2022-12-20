package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UpdateGroupMembershipDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface UserGroupService extends CrudService<UserGroup, String> {

    Mono<UserGroupDTO> createGroup(UserGroup userGroup);

    Mono<List<UserGroupDTO>> removeUsers(UsersForGroupDTO removeUsersFromGroupDTO);

    Mono<UserGroup> findById(String id, AclPermission permission);

    Mono<UserGroupDTO> updateGroup(String id, UserGroup resource);

    Mono<UserGroupDTO> getGroupById(String id);

    Mono<List<UserGroupDTO>> inviteUsers(UsersForGroupDTO inviteUsersToGroupDTO, String originHeader);

    Flux<UserGroupCompactDTO> getAllWithAddUserPermission();

    Mono<List<UserGroupDTO>> changeGroupsForUser(UpdateGroupMembershipDTO updateGroupMembershipDTO, String originHeader);

    Flux<UserGroupCompactDTO> findAllGroupsForUser(String userId);

    Mono<Boolean> bulkRemoveUserFromGroupsWithoutPermission(String userId, Set<String> groupIds);
}
