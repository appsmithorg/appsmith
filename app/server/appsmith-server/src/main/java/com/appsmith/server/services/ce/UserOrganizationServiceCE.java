package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import reactor.core.publisher.Mono;

import java.util.List;

public interface UserOrganizationServiceCE {

    Mono<User> addUserToOrganization(String orgId, User user);

    Mono<Organization> addUserRoleToOrganization(String orgId, UserRole userRole);

    Mono<Organization> addUserToOrganizationGivenUserObject(Organization organization, User user, UserRole userRole);

    Mono<User> leaveOrganization(String orgId);

    Mono<UserRole> updateRoleForMember(String orgId, UserRole userRole, String originHeader);

    Mono<Organization> bulkAddUsersToOrganization(Organization organization, List<User> users, String roleName);

}
