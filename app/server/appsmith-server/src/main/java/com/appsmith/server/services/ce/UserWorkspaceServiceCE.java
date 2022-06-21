package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.UserAndGroupDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserWorkspaceServiceCE {

    Mono<User> addUserToWorkspace(String workspaceId, User user);

    Mono<Workspace> addUserRoleToWorkspace(String workspaceId, UserRole userRole);

    Mono<Workspace> addUserToWorkspaceGivenUserObject(Workspace workspace, User user, UserRole userRole);

    Mono<User> leaveWorkspace(String workspaceId);

    Mono<UserRole> updateRoleForMember(String workspaceId, UserRole userRole, String originHeader);

    Mono<Workspace> bulkAddUsersToWorkspace(Workspace workspace, List<User> users, String roleName);

    Mono<List<UserAndGroupDTO>> getWorkspaceMembers(String workspaceId);
}
