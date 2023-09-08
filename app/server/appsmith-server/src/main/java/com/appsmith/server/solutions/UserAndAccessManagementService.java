package com.appsmith.server.solutions;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.solutions.ce_compatible.UserAndAccessManagementServiceCECompatible;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserAndAccessManagementService extends UserAndAccessManagementServiceCECompatible {
    Mono<List<UserForManagementDTO>> getAllUsers(MultiValueMap<String, String> queryParams);

    Mono<UserForManagementDTO> getUserById(String userId);

    Mono<Boolean> deleteUser(String userId);

    Mono<Boolean> changeRoleAssociations(UpdateRoleAssociationDTO updateRoleAssociationDTO);

    Mono<Boolean> unAssignUsersAndGroupsFromAllAssociatedRoles(List<User> users, List<UserGroup> groups);
}
