/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import java.util.List;
import java.util.Map;
import java.util.Set;
import reactor.core.publisher.Mono;

public interface UserWorkspaceServiceCE {

Mono<User> leaveWorkspace(String workspaceId);

Mono<MemberInfoDTO> updatePermissionGroupForMember(
	String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader);

Mono<List<MemberInfoDTO>> getWorkspaceMembers(String workspaceId);

Mono<Map<String, List<MemberInfoDTO>>> getWorkspaceMembers(Set<String> workspaceIds);

Boolean isLastAdminRoleEntity(PermissionGroup permissionGroup);
}
