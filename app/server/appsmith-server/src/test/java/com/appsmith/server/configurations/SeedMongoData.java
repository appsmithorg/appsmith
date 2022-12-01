package com.appsmith.server.configurations;

import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PricingPlan;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@Configuration
public class SeedMongoData {

    @Bean
    ApplicationRunner init(UserRepository userRepository,
                           WorkspaceRepository workspaceRepository,
                           ApplicationRepository applicationRepository,
                           PageRepository pageRepository,
                           PluginRepository pluginRepository,
                           ReactiveMongoTemplate mongoTemplate,
                           TenantRepository tenantRepository,
                           UserService userService,
                           CommonConfig commonConfig,
                           PermissionGroupRepository permissionGroupRepository,
                           PolicyUtils policyUtils) {

        log.info("Seeding the data");
        final String API_USER_EMAIL = "api_user";
        final String TEST_USER_EMAIL = "usertest@usertest.com";
        final String ADMIN_USER_EMAIL = "admin@solutiontest.com";
        final String DEV_USER_EMAIL = "developer@solutiontest.com";

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy manageWorkspaceAppPolicy = Policy.builder().permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy exportWorkspaceAppPolicy = Policy.builder().permission(WORKSPACE_EXPORT_APPLICATIONS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy userManageWorkspacePolicy = Policy.builder().permission(USER_MANAGE_WORKSPACES.getValue())
                .users(Set.of(API_USER_EMAIL, TEST_USER_EMAIL, ADMIN_USER_EMAIL, DEV_USER_EMAIL))
                .build();

        Policy inviteUserWorkspacePolicy = Policy.builder().permission(WORKSPACE_INVITE_USERS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readWorkspacePolicy = Policy.builder().permission(READ_WORKSPACES.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy manageWorkspacePolicy = Policy.builder().permission(MANAGE_WORKSPACES.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readApiUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy manageApiUserPolicy = Policy.builder().permission(MANAGE_USERS.getValue())
                .users(Set.of(API_USER_EMAIL))
                .build();

        Policy readTestUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(TEST_USER_EMAIL))
                .build();

        Policy readAdminUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(ADMIN_USER_EMAIL))
                .build();

        Policy readDevUserPolicy = Policy.builder().permission(READ_USERS.getValue())
                .users(Set.of(DEV_USER_EMAIL))
                .build();

        Object[][] userData = {
                {"user test", TEST_USER_EMAIL, UserState.ACTIVATED, new HashSet<>(Arrays.asList(readTestUserPolicy, userManageWorkspacePolicy))},
                {"api_user", API_USER_EMAIL, UserState.ACTIVATED, new HashSet<>(Arrays.asList(userManageWorkspacePolicy, readApiUserPolicy, manageApiUserPolicy))},
                {"admin test", ADMIN_USER_EMAIL, UserState.ACTIVATED, new HashSet<>(Arrays.asList(readAdminUserPolicy, userManageWorkspacePolicy))},
                {"developer test", DEV_USER_EMAIL, UserState.ACTIVATED, new HashSet<>(Arrays.asList(readDevUserPolicy, userManageWorkspacePolicy))},
        };
        Object[][] workspaceData = {
                {"Spring Test Workspace", "appsmith-spring-test.com", "appsmith.com", "spring-test-workspace",
                        Set.of(manageWorkspaceAppPolicy, manageWorkspacePolicy, readWorkspacePolicy, inviteUserWorkspacePolicy, exportWorkspaceAppPolicy)},
                {"Another Test Workspace", "appsmith-another-test.com", "appsmith.com", "another-test-workspace",
                        Set.of(manageWorkspaceAppPolicy, manageWorkspacePolicy, readWorkspacePolicy, inviteUserWorkspacePolicy, exportWorkspaceAppPolicy)}
        };

        Object[][] appData = {
                {"LayoutServiceTest TestApplications", Set.of(manageAppPolicy, readAppPolicy)},
                {"TestApplications", Set.of(manageAppPolicy, readAppPolicy)},
                {"Another TestApplications", Set.of(manageAppPolicy, readAppPolicy)}
        };
        Object[][] pageData = {
                {"validPageName", Set.of(managePagePolicy, readPagePolicy)}
        };
        Object[][] pluginData = {
                {"Installed Plugin Name", PluginType.API, "installed-plugin"},
                {"Installed DB Plugin Name", PluginType.DB, "installed-db-plugin"},
                {"Installed JS Plugin Name", PluginType.JS, "installed-js-plugin"},
                {"Not Installed Plugin Name", PluginType.API, "not-installed-plugin"}
        };

        // Seed the plugin data into the DB
        Flux<Plugin> pluginFlux = Flux.just(pluginData)
                .map(array -> {
                    log.debug("Creating the plugins");
                    Plugin plugin = new Plugin();
                    plugin.setName((String) array[0]);
                    plugin.setType((PluginType) array[1]);
                    plugin.setPackageName((String) array[2]);
                    log.debug("Create plugin: {}", plugin);
                    return plugin;
                }).flatMap(pluginRepository::save)
                .cache();

        Tenant defaultTenant = new Tenant();
        defaultTenant.setDisplayName("Default");
        defaultTenant.setSlug("default");
        defaultTenant.setPricingPlan(PricingPlan.FREE);

        Mono<String> defaultTenantId = tenantRepository.findBySlug("default")
                .switchIfEmpty(tenantRepository.save(defaultTenant))
                .map(Tenant::getId)
                .cache();

        Flux<User> userFlux = Flux.just(userData)
                .flatMap(array -> {
                    log.debug("Going to create bare users");
                    User user = new User();
                    user.setName((String) array[0]);
                    user.setEmail((String) array[1]);
                    user.setState((UserState) array[2]);
                    user.setPolicies((Set<Policy>) array[3]);
                    return userRepository.save(user);
                })
                .flatMap(user -> {
                    PermissionGroup permissionGroupUser = new PermissionGroup();
                    permissionGroupUser.setPermissions(Set.of(new Permission(user.getId(), MANAGE_USERS)));
                    permissionGroupUser.setName(user.getId() + "User Name");
                    permissionGroupUser.setAssignedToUserIds(Set.of(user.getId()));
                    return permissionGroupRepository.save(permissionGroupUser)
                            .flatMap(savedPermissionGroup -> {
                                Map<String, Policy> crudUserPolicies = policyUtils.generatePolicyFromPermissionGroupForObject(savedPermissionGroup,
                                        user.getId());

                                User updatedWithPolicies = policyUtils.addPoliciesToExistingObject(crudUserPolicies, user);

                                return userRepository.save(updatedWithPolicies);
                            });
                })
                .collectList()
                .zipWith(defaultTenantId)
                .flatMapMany(tuple -> {
                    List<User> users = tuple.getT1();
                    String tenantId = tuple.getT2();
                    return Flux.fromIterable(users)
                            .map(user -> {
                                user.setTenantId(tenantId);
                                log.debug("Creating user: {}", user);
                                return user;
                            });
                })
                .flatMap(userRepository::save)
                .cache();

        // Seed the workspace data into the DB
        Flux<Workspace> workspaceFlux = mongoTemplate
                .find(new Query().addCriteria(where("name").in(pluginData[0][0], pluginData[1][0], pluginData[2][0])), Plugin.class)
                .map(plugin -> new WorkspacePlugin(plugin.getId(), WorkspacePluginStatus.FREE))
                .collect(Collectors.toSet())
                .cache()
                .repeat()
                .zipWithIterable(List.of(workspaceData))
                .map(tuple -> {
                    final Set<WorkspacePlugin> workspacePlugins = tuple.getT1();
                    final Object[] workspaceArray = tuple.getT2();

                    Workspace workspace = new Workspace();
                    workspace.setName((String) workspaceArray[0]);
                    workspace.setDomain((String) workspaceArray[1]);
                    workspace.setWebsite((String) workspaceArray[2]);
                    workspace.setSlug((String) workspaceArray[3]);
                    workspace.setPolicies((Set<Policy>) workspaceArray[4]);
                    workspace.setPlugins(workspacePlugins);

                    List<UserRole> userRoles = new ArrayList<>();
                    UserRole userRole = new UserRole();
                    String roleName = "Administrator";
                    userRole.setRole(AppsmithRole.generateAppsmithRoleFromName(roleName));
                    userRole.setUsername(API_USER_EMAIL);
                    userRole.setRoleName(roleName);
                    userRoles.add(userRole);
                    workspace.setUserRoles(userRoles);

                    log.debug("In the workspaceFlux. Create Workspace: {}", workspace);
                    return workspace;
                })
                .flatMap(workspaceRepository::save);

        Flux<Workspace> workspaceFlux1 = workspaceRepository.deleteAll()
                .thenMany(pluginFlux)
                .thenMany(userFlux)
                .thenMany(workspaceFlux);

        Flux<User> addUserWorkspaceFlux = workspaceFlux1
                .flatMap(workspace -> userFlux
                        .flatMap(user -> {
                            log.debug("**** In the addUserWorkspaceFlux");
                            log.debug("User: {}", user);
                            log.debug("Workspace: {}", workspace);
                            user.setCurrentWorkspaceId(workspace.getId());
                            Set<String> workspaceIds = user.getWorkspaceIds();
                            if (workspaceIds == null) {
                                workspaceIds = new HashSet<>();
                            }
                            workspaceIds.add(workspace.getId());
                            user.setWorkspaceIds(workspaceIds);
                            log.debug("AddUserWorkspace User: {}, Workspace: {}", user, workspace);
                            return userRepository.save(user)
                                    .map(u -> {
                                        log.debug("Saved the workspace to user. User: {}", u);
                                        return u;
                                    });
                        })
                );

        Query workspaceNameQuery = new Query(where("slug").is(workspaceData[0][3]));
        Mono<Workspace> workspaceByNameMono = mongoTemplate.findOne(workspaceNameQuery, Workspace.class)
                .switchIfEmpty(Mono.error(new Exception("Can't find workspace")));

        Query appNameQuery = new Query(where("name").is(appData[0][0]));
        Mono<Application> appByNameMono = mongoTemplate.findOne(appNameQuery, Application.class)
                .switchIfEmpty(Mono.error(new Exception("Can't find app")));
        return args -> {
            workspaceFlux1
                    .thenMany(addUserWorkspaceFlux)
                    // Query the seed data to get the workspaceId (required for application creation)
                    .then(workspaceByNameMono)
                    .map(workspace -> workspace.getId())
                    // Seed the user data into the DB
                    .flatMapMany(workspaceId ->
                                    // Seed the application data into the DB
                                    Flux.just(appData)
                                            .map(array -> {
                                                Application app = new Application();
                                                app.setName((String) array[0]);
                                                app.setWorkspaceId(workspaceId);
                                                app.setPolicies((Set<Policy>) array[1]);
                                                return app;
                                            })
                                            .flatMap(applicationRepository::save)
                            // Query the seed data to get the applicationId (required for page creation)
                    ).then(appByNameMono)
                    .map(application -> application.getId())
                    .flatMapMany(appId -> Flux.just(pageData)
                            // Seed the page data into the DB
                            .map(array -> {
                                Page page = new Page();
                                page.setName((String) array[0]);
                                page.setApplicationId(appId);
                                page.setPolicies((Set<Policy>) array[1]);
                                return page;
                            })
                            .flatMap(pageRepository::save)
                    )
                    .blockLast();
        };

    }
}
