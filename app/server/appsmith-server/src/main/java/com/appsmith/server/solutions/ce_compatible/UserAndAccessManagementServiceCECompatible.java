package com.appsmith.server.solutions.ce_compatible;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCE;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserAndAccessManagementServiceCECompatible extends UserAndAccessManagementServiceCE {
    Mono<Boolean> deleteProvisionUser(String userId);

    Mono<List<UserForManagementDTO>> getAllUsers(MultiValueMap<String, String> queryParams);

    Mono<Boolean> changeRoleAssociations(UpdateRoleAssociationDTO updateRoleAssociationDTO, String originHeader);

    Mono<Boolean> unAssignUsersAndGroupsFromAllAssociatedRoles(List<User> users, List<UserGroup> groups);
}
