package com.appsmith.server.configurations;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.helpers.UpdateSuperUserHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.cakes.ConfigRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.TenantRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.solutions.PolicySolution;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.helpers.CollectionUtils.findSymmetricDiff;

@Configuration
@Slf4j
@AllArgsConstructor
public class UserConfig {
    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final PolicySolution policySolution;
    private final PolicyGenerator policyGenerator;
    private final UserRepositoryCake userRepository;
    private final PermissionGroupRepositoryCake permissionGroupRepository;
    private final ConfigRepositoryCake configRepository;
    private final TenantRepositoryCake tenantRepository;
    private final UpdateSuperUserHelper updateSuperUserHelper = new UpdateSuperUserHelper();

    /**
     * Responsible for creating super-users based on the admin emails provided in the environment.
     */
    @Bean
    public Mono<Boolean> createSuperUsers() {
        // Read the admin emails from the environment and update the super-users accordingly
        String adminEmailsStr = System.getenv(String.valueOf(APPSMITH_ADMIN_EMAILS));

        Set<String> adminEmails = TextUtils.csvToSet(adminEmailsStr);

        Mono<PermissionGroup> instanceAdminConfigurationMono = configRepository
                .findByName(FieldName.INSTANCE_CONFIG)
                .switchIfEmpty(Mono.error(
                        new IllegalStateException("Instance configuration not found. Cannot create super users.")))
                .map(Config::getConfig)
                .map(config -> (String) config.get(DEFAULT_PERMISSION_GROUP))
                .flatMap(permissionGroupRepository::findById)
                .switchIfEmpty(Mono.error(new IllegalStateException(
                        "Instance admin permission group not found. Cannot create super users.")));

        Mono<Tenant> tenantMono = tenantRepository.findBySlug("default");

        return Mono.zip(instanceAdminConfigurationMono, tenantMono)
                .flatMap(tuple -> {
                    PermissionGroup instanceAdminPG = tuple.getT1();
                    Tenant tenant = tuple.getT2();
                    List<String> updatedAdminEmails = adminEmails.stream()
                            .map(String::trim)
                            .map(String::toLowerCase)
                            .collect(Collectors.toList());
                    return Flux.fromIterable(updatedAdminEmails)
                            .flatMap(email -> userRepository
                                    .findByEmail(email)
                                    .switchIfEmpty(updateSuperUserHelper.createNewUser(
                                            email,
                                            tenant,
                                            instanceAdminPG,
                                            userRepository,
                                            permissionGroupRepository,
                                            policySolution,
                                            policyGenerator)))
                            .map(User::getId)
                            .collect(Collectors.toSet())
                            .flatMap(userIds -> {
                                Set<String> oldSuperUsers = instanceAdminPG.getAssignedToUserIds();
                                if (oldSuperUsers == null || oldSuperUsers.isEmpty()) {
                                    oldSuperUsers = Set.of();
                                }
                                Set<String> updatedUserIds = findSymmetricDiff(oldSuperUsers, userIds);
                                instanceAdminPG.setAssignedToUserIds(userIds);
                                return evictPermissionCacheForUsers(updatedUserIds)
                                        .then(permissionGroupRepository.save(instanceAdminPG));
                            });
                })
                .thenReturn(true);
    }

    public Mono<Void> evictPermissionCacheForUsers(Set<String> userIds) {

        if (userIds == null || userIds.isEmpty()) {
            // Nothing to do here.
            return Mono.empty();
        }

        return Flux.fromIterable(userIds)
                .flatMap(userId -> {
                    return userRepository
                            .findById(userId)
                            .flatMap(user -> permissionGroupRepository.evictPermissionGroupsUser(
                                    user.getEmail(), user.getTenantId()));
                })
                .then();
    }
}
