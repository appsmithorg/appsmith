package com.appsmith.server.solutions;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserGroupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_ALL_USERS;
import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;

@Component
@Slf4j
public class UserManagementServiceImpl implements UserManagementService {
    private final UserGroupService userGroupService;
    private final PermissionGroupService permissionGroupService;
    private final TenantService tenantService;
    private final UserRepository userRepository;

    public UserManagementServiceImpl(UserGroupService userGroupService,
                                     PermissionGroupService permissionGroupService,
                                     TenantService tenantService,
                                     UserRepository userRepository) {

        this.userGroupService = userGroupService;
        this.permissionGroupService = permissionGroupService;
        this.tenantService = tenantService;

        this.userRepository = userRepository;
    }

    @Override
    public Mono<List<UserForManagementDTO>> getAllUsers() {
        return tenantService.getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_MANAGE_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMapMany(tenant -> {
                    return userRepository.getAllUserObjectsWithEmail(tenant.getId());
                })
                // Remove the auto generated anonymous user from this list
                .filter(user -> !user.getEmail().equals(ANONYMOUS_USER))
                .flatMap(this::addGroupsAndRolesForUser)
                .collectList();
    }

    @Override
    public Mono<UserForManagementDTO> getUserById(String userId) {
        return tenantService.getDefaultTenantId()
                .flatMap(tenantId -> tenantService.findById(tenantId, TENANT_MANAGE_ALL_USERS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(tenant -> userRepository.findById(userId))
                // Add the name of the user in response.
                .flatMap(user -> addGroupsAndRolesForUser(user)
                        .map(dto -> {
                            String name = user.getName();
                            if (StringUtils.hasLength(name)) {
                                dto.setName(name);
                            } else {
                                dto.setName(user.getUsername());
                            }
                            return dto;
                        }));
    }

    private Mono<UserForManagementDTO> addGroupsAndRolesForUser(User user) {
        Flux<PermissionGroupInfoDTO> rolesAssignedToUserFlux =
                permissionGroupService.findAllByAssignedToUsersIn(Set.of(user.getId()))
                        .map(permissionGroup -> new PermissionGroupInfoDTO(permissionGroup.getId(), permissionGroup.getName()));
        Flux<UserGroupCompactDTO> groupsForUser = userGroupService.findAllGroupsForUser(user.getId());

        return Mono.zip(
                        rolesAssignedToUserFlux.collectList(),
                        groupsForUser.collectList()
                )
                .map(tuple -> {
                    List<PermissionGroupInfoDTO> rolesInfo = tuple.getT1();
                    List<UserGroupCompactDTO> groupsInfo = tuple.getT2();

                    return new UserForManagementDTO(user.getId(), user.getUsername(), groupsInfo, rolesInfo);
                });
    }
}
