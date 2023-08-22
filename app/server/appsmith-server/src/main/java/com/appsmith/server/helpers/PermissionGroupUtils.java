package com.appsmith.server.helpers;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.repositories.ConfigRepository;
import net.minidev.json.JSONObject;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;

@Component
public class PermissionGroupUtils {
    private Set<String> autoCreatedPermissionGroupIds = null;

    private String defaultRoleForAllUserRoleId = null;

    private final ConfigRepository configRepository;
    private final ModelMapper modelMapper;

    private final UserUtils userUtils;

    public PermissionGroupUtils(ConfigRepository configRepository, ModelMapper modelMapper, UserUtils userUtils) {
        this.configRepository = configRepository;
        this.modelMapper = modelMapper;
        this.userUtils = userUtils;
    }

    private Flux<Config> getAllConfigsWithAutoCreatedPermissionGroups() {
        return this.configRepository.findAllByNameIn(Appsmith.AUTO_CREATED_PERMISSION_GROUP);
    }

    private Mono<Set<String>> getAutoCreatedPermissionGroupIds() {
        if (this.autoCreatedPermissionGroupIds != null) return Mono.just(this.autoCreatedPermissionGroupIds);

        Set<String> tempSet = new HashSet<>();

        return this.getAllConfigsWithAutoCreatedPermissionGroups()
                .collectList()
                .flatMap(configs -> {
                    configs.forEach(config -> {
                        JSONObject jsonObject = config.getConfig();
                        if (jsonObject.containsKey(DEFAULT_PERMISSION_GROUP)
                                && StringUtils.hasLength(jsonObject.getAsString(DEFAULT_PERMISSION_GROUP)))
                            tempSet.add(jsonObject.getAsString(DEFAULT_PERMISSION_GROUP));
                    });
                    return Mono.just(tempSet);
                })
                .doOnNext(permissionGroupIdsSet -> autoCreatedPermissionGroupIds = permissionGroupIdsSet);
    }

    public Mono<Boolean> isAutoCreated(PermissionGroup permissionGroup) {
        return getAutoCreatedPermissionGroupIds()
                .map(autoCreatedPermissionGroupIdSet ->
                        autoCreatedPermissionGroupIdSet.contains(permissionGroup.getId())
                                || Objects.nonNull(permissionGroup.getDefaultDomainType()));
    }

    public Flux<PermissionGroupInfoDTO> mapToPermissionGroupInfoDto(Flux<PermissionGroup> permissionGroupFlux) {
        return permissionGroupFlux
                .flatMap(permissionGroup -> Mono.zip(Mono.just(permissionGroup), isAutoCreated(permissionGroup)))
                .map(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    boolean isAutoCreated = tuple.getT2();
                    PermissionGroupInfoDTO permissionGroupInfoDTO =
                            modelMapper.map(permissionGroup, PermissionGroupInfoDTO.class);
                    permissionGroupInfoDTO.setAutoCreated(isAutoCreated);
                    return permissionGroupInfoDTO;
                });
    }

    public Mono<String> getDefaultRoleForAllUserRoleId() {
        if (org.apache.commons.lang3.StringUtils.isNotEmpty(this.defaultRoleForAllUserRoleId)) {
            return Mono.just(this.defaultRoleForAllUserRoleId);
        }

        return userUtils
                .getDefaultUserPermissionGroup()
                .map(PermissionGroup::getId)
                .doOnNext(defaultRoleId -> this.defaultRoleForAllUserRoleId = defaultRoleId);
    }

    public static boolean isUserManagementRole(PermissionGroup role) {
        Optional<Policy> readPolicy = role.getPolicies().stream()
                .filter(policy -> policy.getPermission().equalsIgnoreCase(READ_PERMISSION_GROUPS.getValue()))
                .findFirst();

        boolean readPolicyNotPresentOrEmpty =
                readPolicy.isEmpty() || readPolicy.get().getPermissionGroups().isEmpty();
        return User.class.getSimpleName().equals(role.getDefaultDomainType())
                || (role.getName().endsWith(FieldName.SUFFIX_USER_MANAGEMENT_ROLE) && readPolicyNotPresentOrEmpty);
    }
}
