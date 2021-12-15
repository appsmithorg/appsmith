package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentNotification;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.CommentThreadNotification;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.QNotification;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import com.appsmith.server.events.CommentNotificationEvent;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.NumberUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.NotificationRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class NotificationServiceCEImpl
        extends BaseService<NotificationRepository, Notification, String>
        implements NotificationServiceCE {

    private final SessionUserService sessionUserService;
    private final ResponseUtils responseUtils;

    public NotificationServiceCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            NotificationRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            ResponseUtils responseUtils) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.responseUtils = responseUtils;
    }

    @Override
    public Mono<Notification> create(Notification notification) {
        Mono<Notification> notificationWithUsernameMono;
        if (StringUtils.isEmpty(notification.getForUsername())) {
            notificationWithUsernameMono = sessionUserService.getCurrentUser()
                    .map(user -> {
                        notification.setForUsername(user.getUsername());
                        return notification;
                    });
        } else {
            notificationWithUsernameMono = Mono.just(notification);
        }

        return notificationWithUsernameMono
                .flatMap(super::create);
    }

    @Override
    public Flux<Notification> get(MultiValueMap<String, String> params) {
        // results will be sorted in descending order of createdAt
        Sort sort = Sort.by(Sort.Direction.DESC, QNotification.notification.createdAt.getMetadata().getName());
        // Remove branch name as notifications are not shared across branches
        params.remove(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME);
        // get page size from query params, default is 10 if param not present
        int pageSize = 10;
        if(params.containsKey("pageSize")) {
            String param = params.get("pageSize").get(0);
            pageSize = NumberUtils.parseInteger(param, 1, 10);
        }
        PageRequest pageRequest = PageRequest.of(0, pageSize, sort);

        // get the beforeDate parameter from query param
        final Instant instant;
        String paramKey = "beforeDate";
        if(params.containsKey(paramKey)) {
            String beforeParam = params.get(paramKey).get(0);
            try {
                instant = Instant.parse(beforeParam);
            } catch (DateTimeParseException e) {
                return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "as " + paramKey));
            }
        } else {
            instant = Instant.now(); // param not present, use current time
        }

        return sessionUserService.getCurrentUser()
                .flatMapMany(
                        user -> repository.findByForUsernameAndCreatedAtBefore(
                                user.getUsername(), instant, pageRequest
                        )
                )
                .map(notification -> {
                    if (notification instanceof CommentNotification) {
                        CommentNotification commentNotification = (CommentNotification) notification;
                        responseUtils.updatePageAndAppIdWithDefaultResourcesForComments(commentNotification.getComment());
                    } else if (notification instanceof CommentThreadNotification) {
                        CommentThreadNotification threadNotification = (CommentThreadNotification) notification;
                        responseUtils.updatePageAndAppIdWithDefaultResourcesForComments(threadNotification.getCommentThread());
                    }
                    return notification;
                });
    }

    @Override
    public Mono<Notification> findByIdAndBranchName(String id, String branchName) {
        // Ignore branch name as notifications are independent of branchNames
        return repository.findById(id)
                .map(notification -> {
                    if (notification instanceof CommentNotification) {
                        CommentNotification commentNotification = (CommentNotification) notification;
                        responseUtils.updatePageAndAppIdWithDefaultResourcesForComments(commentNotification.getComment());
                    } else if(notification instanceof CommentThreadNotification) {
                        CommentThreadNotification threadNotification = (CommentThreadNotification) notification;
                        responseUtils.updatePageAndAppIdWithDefaultResourcesForComments(threadNotification.getCommentThread());
                    }
                    return notification;
                });
    }

    /**
     * Creates a notification for the provided comment which is under provided comment thread
     * @param comment
     * @param forUsername
     * @param event
     * @return
     */
    @Override
    public Mono<Notification> createNotification(Comment comment, CommentNotificationEvent event, String forUsername) {
        final CommentNotification notification = new CommentNotification();
        notification.setComment(comment);
        notification.setForUsername(forUsername);
        notification.setIsRead(false);
        notification.setEvent(event);
        return repository.save(notification);
    }

    @Override
    public Flux<Notification> createNotification(CommentThread commentThread, CommentNotificationEvent event, String authorUsername) {
        if(!CollectionUtils.isEmpty(commentThread.getSubscribers())) {
            List<Notification> notificationMonoList = new ArrayList<>(commentThread.getSubscribers().size());
            for(String subscriberUserName: commentThread.getSubscribers()) {
                if(!subscriberUserName.equals(authorUsername)) {
                    CommentThreadNotification commentThreadNotification = new CommentThreadNotification();
                    commentThreadNotification.setCommentThread(commentThread);
                    commentThreadNotification.setForUsername(subscriberUserName);
                    commentThreadNotification.setIsRead(false);
                    commentThreadNotification.setEvent(event);
                    notificationMonoList.add(commentThreadNotification);
                }
            }
            return repository.saveAll(notificationMonoList);
        }
        return Flux.empty();
    }

    @Override
    public Mono<UpdateIsReadNotificationByIdDTO> updateIsRead(UpdateIsReadNotificationByIdDTO dto) {
        return sessionUserService.getCurrentUser()
                .flatMap(user ->
                        repository.updateIsReadByForUsernameAndIdList(
                                user.getUsername(), dto.getIdList(), dto.getIsRead()
                        ).thenReturn(dto)
                );
    }

    @Override
    public Mono<UpdateIsReadNotificationDTO> updateIsRead(UpdateIsReadNotificationDTO dto) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> repository.updateIsReadByForUsername(user.getUsername(), dto.getIsRead())
                        .thenReturn(dto)
                );
    }

    @Override
    public Mono<Long> getUnreadCount() {
        return sessionUserService.getCurrentUser().flatMap(user ->
                repository.countByForUsernameAndIsReadIsFalse(user.getUsername())
        );
    }
}
