package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class UserPermissionUtils {
    public static boolean validaDomainObjectPermissionExists(
            BaseDomain baseDomain, AclPermission aclPermission, Set<String> permissionGroups) {
        Optional<Policy> permissionPolicy = baseDomain.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(aclPermission.getValue()))
                .findFirst();
        return permissionPolicy.isPresent()
                && !Collections.disjoint(permissionPolicy.get().getPermissionGroups(), permissionGroups);
    }

    public static Mono<Boolean> validateDomainObjectPermissionsOrError(
            Flux<BaseDomain> baseDomainFlux,
            String domainEntity,
            Mono<Set<String>> permissionGroupIdsMono,
            AclPermission aclPermission,
            AppsmithError appsmithError) {
        return baseDomainFlux
                .zipWith(permissionGroupIdsMono.repeat())
                .map(tuple -> {
                    if (!validaDomainObjectPermissionExists(tuple.getT1(), aclPermission, tuple.getT2())) {
                        throw new AppsmithException(
                                appsmithError, domainEntity, tuple.getT1().getId());
                    }
                    return Boolean.TRUE;
                })
                .collectList()
                .thenReturn(Boolean.TRUE);
    }
}
