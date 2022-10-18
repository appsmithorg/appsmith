package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.UserAndPermissionGroupDTO;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface UserWorkspaceServiceCE {

    Mono<User> leaveWorkspace(String workspaceId);

    Mono<UserAndPermissionGroupDTO> updatePermissionGroupForMember(String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader);

    Mono<List<UserAndPermissionGroupDTO>> getWorkspaceMembers(String workspaceId);

    Mono<Map<String, List<UserAndPermissionGroupDTO>>> getWorkspaceMembers(Set<String> workspaceIds);
}
