package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.events.UserChangedEvent;
import com.appsmith.server.events.UserPhotoChangedEvent;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.NotificationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
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
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final OrganizationRepository organizationRepository;

    public User publish(User user) {
        applicationEventPublisher.publishEvent(new UserChangedEvent(user));
        return user;
    }

    public void publish(String userId, String photoAssetId) {
        applicationEventPublisher.publishEvent(new UserPhotoChangedEvent(userId, photoAssetId));
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

        updateNameInNotifications(user)
                .subscribeOn(Schedulers.elastic())
                .subscribe();
    }

    @Async
    @EventListener
    public void handle(UserPhotoChangedEvent event) {
        log.debug("Handling user photo changes {}", event.getUserId());
        updatePhotoIdInComments(event.getUserId(), event.getPhotoAssetId())
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

    private Mono<Void> updateNameInNotifications(User user) {
        if (user.getId() == null) {
            log.warn("Attempt to update name in notifications for user with null ID.");
            return Mono.empty();
        }

        log.debug("Updating name in notifications for user {}", user.getId());
        return notificationRepository.updateCommentAuthorNames(user.getId(), user.getName());
    }

    private Mono<Void> updatePhotoIdInComments(String userId, String photoId) {
        if (userId == null) {
            log.warn("Attempt to photo id in comments for user with null ID.");
            return Mono.empty();
        }

        log.debug("Updating photo id in comments for user {}", userId);
        return commentRepository.updatePhotoId(userId, photoId);
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
