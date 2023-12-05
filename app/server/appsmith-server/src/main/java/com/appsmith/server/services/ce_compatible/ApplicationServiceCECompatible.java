package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.applications.base.ApplicationServiceCE;
import com.appsmith.server.dtos.InviteUsersToApplicationDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateApplicationRoleDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationServiceCECompatible extends ApplicationServiceCE {

    Mono<List<PermissionGroupInfoDTO>> fetchAllDefaultRoles(String applicationId);

    Mono<List<MemberInfoDTO>> inviteToApplication(
            InviteUsersToApplicationDTO inviteToApplicationDTO, String originHeader);

    Mono<MemberInfoDTO> updateRoleForMember(String applicationId, UpdateApplicationRoleDTO updateApplicationRoleDTO);

    Mono<List<PermissionGroupInfoDTO>> fetchAllDefaultRolesWithoutPermissions();
}
