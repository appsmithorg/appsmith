package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserGroupService extends CrudService<UserGroup, String> {

    Mono<UserGroupDTO> removeUsers(UsersForGroupDTO removeUsersFromGroupDTO);

    Mono<UserGroup> findById(String id, AclPermission permission);

    Mono<UserGroupDTO> getGroupById(String id);

    Mono<List<UserGroupDTO>> inviteUsers(UsersForGroupDTO inviteUsersToGroupDTO, String originHeader);
}
