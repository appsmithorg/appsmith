package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;

@Service
@Slf4j
public class UserOrganizationServiceImpl implements UserOrganizationService {
    private final SessionUserService sessionUserService;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Autowired
    public UserOrganizationServiceImpl(SessionUserService sessionUserService,
                                       OrganizationRepository organizationRepository, UserRepository userRepository) {
        this.sessionUserService = sessionUserService;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    /**
     * This function adds an organizationId to the user. This will allow users to switch between multiple organizations
     * and operate inside them independently.
     *
     * @param orgId The organizationId being added to the user.
     * @param user
     * @return
     */
    @Override
    public Mono<User> addUserToOrganization(String orgId, User user) {

        Mono<User> currentUserMono;
        if (user == null) {
            currentUserMono = sessionUserService.getCurrentUser();
        } else {
            currentUserMono = Mono.just(user);
        }

        return organizationRepository.findById(orgId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "organization", orgId)))
                .zipWith(currentUserMono)
                .map(tuple -> {
                    Organization organization = tuple.getT1();
                    User user1 = tuple.getT2();
                    log.debug("Adding organization {} with id {} to user {}", organization.getName(), organization.getId(), user1.getEmail());
                    return user1;
                })
                .map(user1 -> {
                    Set<String> organizationIds = user1.getOrganizationIds();
                    if (organizationIds == null) {
                        organizationIds = new HashSet<>();
                        if (user1.getCurrentOrganizationId() != null) {
                            // If the list of organizationIds for a user is null, add the current user org
                            // to the new list as well
                            organizationIds.add(user1.getCurrentOrganizationId());
                        }
                    }
                    if (!organizationIds.contains(orgId)) {
                        // Only add to the organizationIds array if it's not already present
                        organizationIds.add(orgId);
                        user1.setOrganizationIds(organizationIds);
                    }
                    // Set the current organization to the newly added organization
                    user1.setCurrentOrganizationId(orgId);
                    return user1;
                })
                .flatMap(userRepository::save);
    }

    @Override
    public Mono<User> saveUser(User user) {
        return userRepository.save(user);
    }
}
