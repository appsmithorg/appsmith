package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface UserWorkspaceServiceCE {

    Mono<User> leaveWorkspace(String workspaceId);

    Mono<WorkspaceMemberInfoDTO> updatePermissionGroupForMember(String workspaceId, UpdatePermissionGroupDTO changeUserGroupDTO, String originHeader);

    Mono<List<WorkspaceMemberInfoDTO>> getWorkspaceMembers(String workspaceId);

    Mono<Map<String, List<WorkspaceMemberInfoDTO>>> getWorkspaceMembers(Set<String> workspaceIds);
}
