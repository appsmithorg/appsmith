package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.events.UserChangedEvent;
import com.appsmith.server.repositories.NotificationRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RequiredArgsConstructor
@Slf4j
public class UserChangedHandlerCEImpl implements UserChangedHandlerCE {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final NotificationRepository notificationRepository;
    private final WorkspaceRepository workspaceRepository;

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

        updateNameInUserRoles(user)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    private Mono<Void> updateNameInUserRoles(User user) {
        if (user.getId() == null) {
            log.warn("Attempt to update name in userRoles of workspace for user with null ID.");
            return Mono.empty();
        }

        log.debug("Updating name in userRoles of workspace for user {}", user.getId());
        return workspaceRepository.updateUserRoleNames(user.getId(), user.getName());
    }
}
