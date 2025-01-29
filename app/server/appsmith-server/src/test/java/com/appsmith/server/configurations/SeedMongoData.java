package com.appsmith.server.configurations;

import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PricingPlan;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.solutions.PolicySolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_WORKSPACES;

@Slf4j
@Configuration
public class SeedMongoData {

    @Bean
    ApplicationRunner init(
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            PluginRepository pluginRepository,
            OrganizationRepository tenantRepository,
            PermissionGroupRepository permissionGroupRepository,
            PolicySolution policySolution) {

        log.info("Seeding the data");
        final String API_USER_EMAIL = "api_user";
        final String TEST_USER_EMAIL = "usertest@usertest.com";
        final String ADMIN_USER_EMAIL = "admin@solutiontest.com";
        final String DEV_USER_EMAIL = "developer@solutiontest.com";

        Policy userManageWorkspacePolicy =
                Policy.builder().permission(USER_MANAGE_WORKSPACES.getValue()).build();

        Policy readApiUserPolicy =
                Policy.builder().permission(READ_USERS.getValue()).build();

        Policy manageApiUserPolicy =
                Policy.builder().permission(MANAGE_USERS.getValue()).build();

        Policy readTestUserPolicy =
                Policy.builder().permission(READ_USERS.getValue()).build();

        Policy readAdminUserPolicy =
                Policy.builder().permission(READ_USERS.getValue()).build();

        Policy readDevUserPolicy =
                Policy.builder().permission(READ_USERS.getValue()).build();

        Object[][] userData = {
            {
                "user test",
                TEST_USER_EMAIL,
                UserState.ACTIVATED,
                new HashSet<>(Arrays.asList(readTestUserPolicy, userManageWorkspacePolicy))
            },
            {
                "api_user",
                API_USER_EMAIL,
                UserState.ACTIVATED,
                new HashSet<>(Arrays.asList(userManageWorkspacePolicy, readApiUserPolicy, manageApiUserPolicy))
            },
            {
                "admin test",
                ADMIN_USER_EMAIL,
                UserState.ACTIVATED,
                new HashSet<>(Arrays.asList(readAdminUserPolicy, userManageWorkspacePolicy))
            },
            {
                "developer test",
                DEV_USER_EMAIL,
                UserState.ACTIVATED,
                new HashSet<>(Arrays.asList(readDevUserPolicy, userManageWorkspacePolicy))
            },
        };

        Object[][] pluginData = {
            {"Installed Plugin Name", PluginType.API, "installed-plugin", true},
            {"Installed DB Plugin Name", PluginType.DB, "installed-db-plugin", true},
            {"Installed JS Plugin Name", PluginType.JS, "installed-js-plugin", true},
            {"Not Installed Plugin Name", PluginType.API, "not-installed-plugin", false}
        };

        // Seed the plugin data into the DB
        Flux<Plugin> pluginFlux = Flux.just(pluginData)
                .map(array -> {
                    log.debug("Creating the plugins");
                    Plugin plugin = new Plugin();

                    plugin.setName((String) array[0]);
                    plugin.setType((PluginType) array[1]);
                    plugin.setPackageName((String) array[2]);
                    plugin.setDefaultInstall((Boolean) array[3]);
                    log.debug("Create plugin: {}", plugin);
                    return plugin;
                })
                .flatMap(pluginRepository::save);

        Organization defaultOrganization = new Organization();
        defaultOrganization.setDisplayName("Default");
        defaultOrganization.setSlug("default");
        defaultOrganization.setPricingPlan(PricingPlan.FREE);

        Mono<String> defaultTenantId = tenantRepository
                .findBySlug("default")
                .switchIfEmpty(tenantRepository.save(defaultOrganization))
                .map(Organization::getId)
                .cache();

        Flux<User> userFlux = Flux.just(userData)
                .zipWith(defaultTenantId.repeat())
                .flatMap(tuple -> {
                    Object[] array = tuple.getT1();
                    String tenantId = tuple.getT2();
                    log.debug("Going to create bare users");
                    User user = new User();
                    user.setName((String) array[0]);
                    user.setEmail((String) array[1]);
                    user.setState((UserState) array[2]);
                    user.setPolicies((Set<Policy>) array[3]);
                    user.setTenantId(tenantId);
                    return userRepository.save(user);
                })
                .flatMap(user -> {
                    PermissionGroup permissionGroupUser = new PermissionGroup();
                    permissionGroupUser.setPermissions(Set.of(new Permission(user.getId(), MANAGE_USERS)));
                    permissionGroupUser.setName(user.getId() + "User Name");
                    permissionGroupUser.setAssignedToUserIds(Set.of(user.getId()));
                    return permissionGroupRepository.save(permissionGroupUser).flatMap(savedPermissionGroup -> {
                        Map<String, Policy> crudUserPolicies =
                                policySolution.generatePolicyFromPermissionGroupForObject(
                                        savedPermissionGroup, user.getId());

                        User updatedWithPolicies = policySolution.addPoliciesToExistingObject(crudUserPolicies, user);

                        return userRepository.save(updatedWithPolicies);
                    });
                });

        return args -> {
            Mono.when(workspaceRepository.deleteAll(), pluginFlux, userFlux).block();
        };
    }
}
