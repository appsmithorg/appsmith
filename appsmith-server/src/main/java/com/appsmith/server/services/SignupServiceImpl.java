package com.appsmith.server.services;

import com.appsmith.server.constants.AclConstants;
import com.appsmith.server.domains.Group;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;

@Component
@Slf4j
public class SignupServiceImpl implements SignupService {
    private final OrganizationService organizationService;
    private final UserService userService;
    private final SessionUserService sessionUserService;
    private final GroupService groupService;

    @Autowired
    public SignupServiceImpl(OrganizationService organizationService,
                             UserService userService,
                             SessionUserService sessionUserService,
                             GroupService groupService) {
        this.organizationService = organizationService;
        this.userService = userService;
        this.sessionUserService = sessionUserService;
        this.groupService = groupService;
    }

    /**
     * {@inheritDoc}
     * @param organization
     * @return
     */
    @Override
    public Mono<Organization> createOrganization(Organization organization) {
        log.debug("Creating an organization as part of signup flow: {} ", organization);
        // Create the organization with details provided
        Mono<Organization> orgMono = organizationService.create(organization);

        // Create the org-admin group for the new organization
        Mono<Group> groupMono = orgMono.flatMap(org -> {
                                        Group group = new Group();
                                        group.setName(AclConstants.GROUP_ORG_ADMIN);
                                        group.setOrganizationId(org.getId());
                                        group.setPermissions(AclConstants.PERMISSIONS_GROUP_ORG_ADMIN);
                                        log.debug("Creating group for org: {}", org);
                                        return groupService.create(group);
                                    });

        // Get details of user creating the organization
        Mono<User> userMono = sessionUserService.getCurrentUser();

        // Assign the newly created group and organization to the user
        return Mono.zip(orgMono, userMono, groupMono)
                .flatMap(tuple -> {
                    Organization org = tuple.getT1();
                    User user = tuple.getT2();
                    Group group = tuple.getT3();
                    log.debug("Going to update userId: {} with orgId: {} and groupId: {}", user.getId(), org.getId(), group.getId());
                    // Assign the user to the new organization
                    // TODO: Make organizationId as an array and allow a user to be assigned to multiple orgs
                    user.setCurrentOrganizationId(org.getId());
                    Set<String> organizationIds = user.getOrganizationIds();
                    if (organizationIds == null) {
                        organizationIds = new HashSet<>();
                    }
                    organizationIds.add(org.getId());
                    user.setOrganizationIds(organizationIds);
                    // Assign the org-admin group to the user who created the new organization
                    user.getGroupIds().add(group.getId());
                    return userService.update(user.getId(), user)
                            .thenReturn(org);
                });
    }
}
