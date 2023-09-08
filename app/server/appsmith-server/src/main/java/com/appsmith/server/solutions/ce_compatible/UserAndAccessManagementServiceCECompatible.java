package com.appsmith.server.solutions.ce_compatible;

import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCE;
import reactor.core.publisher.Mono;

public interface UserAndAccessManagementServiceCECompatible extends UserAndAccessManagementServiceCE {
    Mono<Boolean> deleteProvisionUser(String userId);
}
