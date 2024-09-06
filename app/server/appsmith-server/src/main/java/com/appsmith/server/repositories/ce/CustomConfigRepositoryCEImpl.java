package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import io.micrometer.observation.ObservationRegistry;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import static com.appsmith.external.constants.spans.UserSpan.FETCH_ALL_PERMISSION_GROUPS_OF_USER_SPAN;

public class CustomConfigRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Config>
        implements CustomConfigRepositoryCE {

    private final ObservationRegistry observationRegistry;

    public CustomConfigRepositoryCEImpl(ObservationRegistry observationRegistry) {
        this.observationRegistry = observationRegistry;
    }

    @Override
    public Mono<Config> findByName(String name, AclPermission permission) {
        BridgeQuery<Config> nameCriteria = Bridge.equal(Config.Fields.name, name);
        return queryBuilder().criteria(nameCriteria).permission(permission).one();
    }

    @Override
    public Mono<Config> findByNameAsUser(String name, User user, AclPermission permission) {
        return getAllPermissionGroupsForUser(user)
                .name(FETCH_ALL_PERMISSION_GROUPS_OF_USER_SPAN)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(permissionGroups -> queryBuilder()
                        .criteria(Bridge.equal(Config.Fields.name, name))
                        .permission(permission)
                        .permissionGroups(permissionGroups)
                        .one());
    }
}
