package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserOrganizationService {
    Mono<User> addUserToOrganization(String orgId, User user);

    Mono<User> saveUser(User user);

    Mono<Organization> addUserRoleToOrganization(String orgId, UserRole userRole);

    Mono<Organization> addUserToOrganizationGivenUserObject(Organization organization, User user, UserRole userRole);

    Mono<Organization> removeUserRoleFromOrganization(String orgId, UserRole userRole);

    Mono<Organization> removeUserRoleFromOrganizationGivenUserObject(Organization organization, User user);

    Mono<UserRole> updateRoleForMember(String orgId, UserRole userRole);

    Mono<Organization> bulkAddUsersToOrganization(Organization organization, List<User> users, String roleName);
}
