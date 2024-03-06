package com.appsmith.server.solutions;

import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.solutions.ce_compatible.UserAndAccessManagementServiceCECompatible;
import reactor.core.publisher.Mono;

public interface UserAndAccessManagementService extends UserAndAccessManagementServiceCECompatible {

    Mono<UserForManagementDTO> getUserById(String userId);

    Mono<Boolean> deleteUser(String userId);
}
