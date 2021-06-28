package com.appsmith.server.solutions;

import com.appsmith.server.domains.User;
import com.appsmith.server.events.UserChangedEvent;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserChangedHandler {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final CommentRepository commentRepository;
    private final OrganizationRepository organizationRepository;

    public User publish(User user) {
        applicationEventPublisher.publishEvent(new UserChangedEvent(user));
        return user;
    }

    @Async
    @EventListener
    public void handle(UserChangedEvent event) {
        // The `user` object is expected to contain the NEW name.
        final User user = event.getUser();
        log.debug("Handling user document changes {}", user);
        updateNameInComments(user)
                .subscribeOn(Schedulers.elastic())
                .subscribe();

        updateNameInUserRoles(user)
                .subscribeOn(Schedulers.elastic())
                .subscribe();
    }

    private Mono<Void> updateNameInComments(User user) {
        if (user.getId() == null) {
            log.warn("Attempt to update name in comments for user with null ID.");
            return Mono.empty();
        }

        log.debug("Updating name in comments for user {}", user.getId());
        return commentRepository.updateAuthorNames(user.getId(), user.getName());
    }

    private Mono<Void> updateNameInUserRoles(User user) {
        if (user.getId() == null) {
            log.warn("Attempt to update name in userRoles of organization for user with null ID.");
            return Mono.empty();
        }

        log.debug("Updating name in userRoles of organization for user {}", user.getId());
        return organizationRepository.updateUserRoleNames(user.getId(), user.getName());
    }
}
