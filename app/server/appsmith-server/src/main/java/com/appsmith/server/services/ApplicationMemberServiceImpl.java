package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.ce.MemberInfoCE_DTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PermissionGroupPermission;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.appsmith.server.constants.FieldName.APPLICATION;
import static com.appsmith.server.helpers.AppsmithComparators.applicationMembersComparator;

@Service
@AllArgsConstructor
public class ApplicationMemberServiceImpl implements ApplicationMemberService {

    private final UserGroupRepository userGroupRepository;
    private final PermissionGroupService permissionGroupService;
    private final ApplicationPermission applicationPermission;
    private final PermissionGroupPermission permissionGroupPermission;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    /**
     * The method gets all the users and user groups who have been assigned default application roles.
     * @param applicationId
     * @return
     */
    @Override
    public Mono<List<MemberInfoDTO>> getAllMembersForApplication(String applicationId) {
        Mono<Application> applicationMono = applicationRepository.findById(applicationId, Optional.of(applicationPermission.getReadPermission()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, APPLICATION, applicationId)))
                .cache();
        Mono<List<PermissionGroup>> defaultAppRolesMono = applicationMono
                .flatMapMany(application -> permissionGroupService
                        .getAllDefaultRolesForApplication(application, Optional.of(permissionGroupPermission.getMembersReadPermission())))
                .collectList()
                .cache();
        return getSortedApplicationMemberInfoList(defaultAppRolesMono, applicationMono);
    }

    private Mono<List<MemberInfoDTO>> getSortedApplicationMemberInfoList(Mono<List<PermissionGroup>> rolesMono, Mono<Application> applicationMono) {
        Mono<List<MemberInfoDTO>> incompleteApplicationMembersInfoMono = Mono.zip(rolesMono, applicationMono)
                .map(tuple -> getApplicationMembersInfoList(tuple.getT1(), tuple.getT2()));

        return incompleteApplicationMembersInfoMono
                .flatMap(this::hydrateAppMemberInfoList)
                .map(list -> {
                    list.sort(applicationMembersComparator());
                    return list;
                });
    }

    /**
     * The method hydrates list of members with informational details such as username, name or group name.
     * @param appMemberInfoList
     * @return
     */
    private Mono<List<MemberInfoDTO>> hydrateAppMemberInfoList(List<MemberInfoDTO> appMemberInfoList) {
        // Create a Mono<Map> of userId to user for all userIds present in appMemberInfoList.
        // These can then be used to hydrate the user entities of appMemberInfoList with required details based on userId.
        List<String> userIds = appMemberInfoList.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserId()))
                .map(MemberInfoDTO::getUserId)
                .toList();
        Mono<Map<String, User>> userMapMono = userRepository.findAllById(userIds).collectMap(User::getId);

        // Create a Mono<Map> of userGroupId to user group for all userGroupIds present in appMemberInfoList.
        // These can then be used to hydrate the user group entities of appMemberInfoList with required details based on userGroupId.
        List<String> groupIds = appMemberInfoList.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserGroupId()))
                .map(MemberInfoDTO::getUserGroupId)
                .toList();
        Mono<Map<String, UserGroup>> groupMapMono = userGroupRepository.findAllById(groupIds).collectMap(UserGroup::getId);

        return Mono.zip(userMapMono, groupMapMono)
                .map(tuple -> {
                    Map<String, User> userMap = tuple.getT1();
                    Map<String, UserGroup> groupMap = tuple.getT2();
                    appMemberInfoList.forEach(member -> {
                        if (StringUtils.isNotEmpty(member.getUserId()) && userMap.containsKey(member.getUserId())) {
                            member.setUsername(userMap.get(member.getUserId()).getUsername());
                            member.setName(Optional.ofNullable(userMap.get(member.getUserId()).getName())
                                    .orElse(userMap.get(member.getUserId()).computeFirstName()));
                        } else if (StringUtils.isNotEmpty(member.getUserGroupId()) && groupMap.containsKey(member.getUserGroupId())) {
                            member.setName(groupMap.get(member.getUserGroupId()).getName());
                        }
                    });
                    return appMemberInfoList;
                });
    }

    /**
     * The method creates a list of unique members with only userId or groupId detail.
     * @param roles
     * @return
     */
    private List<MemberInfoDTO> getApplicationMembersInfoList(List<PermissionGroup> roles, Application application) {
        Set<String> userIds = new HashSet<>(); // Set of already collected users
        List<MemberInfoDTO> applicationMembersList = new ArrayList<>();
        roles.forEach(role -> {
            PermissionGroupInfoDTO roleInfoDTO = new PermissionGroupInfoDTO(role.getId(), role.getName(),
                    role.getDescription(), role.getDefaultDomainId(), role.getDefaultDomainType(), application.getName());
            Stream.ofNullable(role.getAssignedToUserIds())
                    .flatMap(Collection::stream)
                    .filter(userId -> !userIds.contains(userId))
                    .forEach(userId -> {
                        applicationMembersList.add(MemberInfoDTO.builder()
                                .userId(userId)
                                .roles(List.of(roleInfoDTO))
                                .build());  // collect user
                        userIds.add(userId); // update set of already collected users
                    });
        });
        Set<String> groupIds = new HashSet<>(); // Set of already collected user groups
        roles.forEach(role -> {
            PermissionGroupInfoDTO roleInfoDTO = new PermissionGroupInfoDTO(role.getId(), role.getName(),
                    role.getDescription(), role.getDefaultDomainId(), role.getDefaultDomainType(), application.getName());
            Stream.ofNullable(role.getAssignedToGroupIds())
                    .flatMap(Collection::stream)
                    .filter(groupId -> !groupIds.contains(groupId))
                    .forEach(groupId -> {
                        applicationMembersList.add(MemberInfoDTO.builder()
                                .userGroupId(groupId)
                                .roles(List.of(roleInfoDTO))
                                .build()); // collect user groups
                        groupIds.add(groupId); // update set of already collected user groups
                    });
        });
        return applicationMembersList;
    }

    @Override
    public Flux<MemberInfoDTO> getAllApplicationsMembersForWorkspace(String workspaceId) {
        Flux<Application> applicationFlux = applicationRepository.getAllApplicationsInWorkspace(workspaceId,
                Optional.of(applicationPermission.getReadPermission())).cache();
        return applicationFlux
                .flatMap(application -> getAllMembersForApplication(application.getId()))
                .flatMap(Flux::fromIterable);
    }
}