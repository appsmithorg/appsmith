package com.appsmith.server.solutions;

import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCE;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserAndAccessManagementService extends UserAndAccessManagementServiceCE {
    Mono<List<UserForManagementDTO>> getAllUsers();

    Mono<UserForManagementDTO> getUserById(String userId);

    Mono<Boolean> deleteUser(String userId);

    Mono<Boolean> changeRoleAssociations(UpdateRoleAssociationDTO updateRoleAssociationDTO);
}
