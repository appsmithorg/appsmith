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
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.PolicySolution;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;
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
    private final UserRepository userRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ConfigRepository configRepository;
    private final TenantRepository tenantRepository;
    private final UpdateSuperUserHelper updateSuperUserHelper = new UpdateSuperUserHelper();

    /**
     * Responsible for creating super-users based on the admin emails provided in the environment.
     */
    @Bean
    public boolean createSuperUsers() {
        // Read the admin emails from the environment and update the super-users accordingly
        String adminEmailsStr = System.getenv(String.valueOf(APPSMITH_ADMIN_EMAILS));

        Set<String> adminEmails = TextUtils.csvToSet(adminEmailsStr);

        Optional<Config> instanceAdminConfigurationOptional = configRepository.findByName(FieldName.INSTANCE_CONFIG);
        if (instanceAdminConfigurationOptional.isEmpty()) {
            log.error("Instance configuration not found. Cannot create super users.");
            return false;
        }
        Config instanceAdminConfiguration = instanceAdminConfigurationOptional.get();

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Optional<PermissionGroup> instanceAdminPGOptional =
                permissionGroupRepository.findById(instanceAdminPermissionGroupId);
        if (instanceAdminPGOptional.isEmpty()) {
            log.error("Instance admin permission group not found. Cannot create super users.");
            return false;
        }
        PermissionGroup instanceAdminPG = instanceAdminPGOptional.get();

        Optional<Tenant> tenantOptional = tenantRepository.findBySlug("default");
        if (tenantOptional.isEmpty()) {
            log.error("Default tenant not found. Cannot create super users.");
            return false;
        }
        Tenant tenant = tenantOptional.get();

        Set<String> userIds = adminEmails.stream()
                .map(String::trim)
                .map(String::toLowerCase)
                .map(email -> {
                    User user = null;
                    Optional<User> userOptional = userRepository.findByEmail(email);
                    if (userOptional.isPresent()) {
                        user = userOptional.get();
                    }

                    if (user == null) {
                        log.info("Creating super user with username {}", email);
                        user = updateSuperUserHelper.createNewUser(
                                email,
                                tenant,
                                instanceAdminPG,
                                userRepository,
                                permissionGroupRepository,
                                policySolution,
                                policyGenerator);
                    }

                    return user.getId();
                })
                .collect(Collectors.toSet());

        Set<String> oldSuperUsers = instanceAdminPG.getAssignedToUserIds();
        if (oldSuperUsers == null || oldSuperUsers.isEmpty()) {
            oldSuperUsers = Set.of();
        }
        Set<String> updatedUserIds = findSymmetricDiff(oldSuperUsers, userIds);
        evictPermissionCacheForUsers(updatedUserIds, userRepository, cacheableRepositoryHelper);

        instanceAdminPG.setAssignedToUserIds(userIds);
        permissionGroupRepository.save(instanceAdminPG);
        return true;
    }

    public static void evictPermissionCacheForUsers(
            Set<String> userIds, UserRepository userRepository, CacheableRepositoryHelper cacheableRepositoryHelper) {

        if (userIds == null || userIds.isEmpty()) {
            // Nothing to do here.
            return;
        }

        userIds.forEach(userId -> {
            userRepository.findById(userId).ifPresent(user -> cacheableRepositoryHelper
                    .evictPermissionGroupsUser(user.getEmail(), user.getTenantId())
                    .block());
        });
    }
}
