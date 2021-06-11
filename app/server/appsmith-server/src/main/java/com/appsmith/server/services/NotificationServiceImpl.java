package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentNotification;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.CommentThreadNotification;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.QNotification;
import com.appsmith.server.dtos.NotificationsResponseDTO;
import com.appsmith.server.dtos.PaginationDTO;
import com.appsmith.server.repositories.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import javax.validation.Validator;
import java.util.List;

@Slf4j
@Service
public class NotificationServiceImpl
        extends BaseService<NotificationRepository, Notification, String>
        implements NotificationService {

    private final SessionUserService sessionUserService;

    public NotificationServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            NotificationRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
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
        Sort sort = Sort.by(Sort.Direction.DESC, QNotification.notification.createdAt.getMetadata().getName());
        PageRequest pageRequest = PageRequest.of(0, 10, sort);

        return sessionUserService.getCurrentUser()
                .flatMapMany(
                        user -> repository.findByForUsername(user.getUsername(), pageRequest)
                );
    }

    @Override
    public Mono<NotificationsResponseDTO> getAll(MultiValueMap<String, String> params) {
        Sort sort = Sort.by(Sort.Direction.DESC, QNotification.notification.createdAt.getMetadata().getName());
        PageRequest pageRequest = getPageRequestFromParams(params, 10, sort);

        return sessionUserService.getCurrentUser().flatMap(user -> {
            Mono<Long> countMono = repository.countByForUsername(user.getUsername());
            Mono<Long> unreadCountMono = repository.countByForUsernameAndIsReadIsTrue(user.getUsername());
            Mono<Tuple2<Long, Long>> tuple2Mono1 = Mono.zip(countMono, unreadCountMono);

            Mono<Tuple2<List<Notification>, Tuple2<Long, Long>>> tuple2Mono = repository.findByForUsername(
                    user.getUsername(), pageRequest).collectList()
                    .zipWith(tuple2Mono1);

            return tuple2Mono.map(objects -> {
                List<Notification> notificationList = objects.getT1();
                Long resultCount = objects.getT2().getT1();
                Long unreadCount = objects.getT2().getT2();
                PaginationDTO pagination = new PaginationDTO(
                        pageRequest.getPageNumber(), pageRequest.getPageSize(), resultCount
                );
                return new NotificationsResponseDTO(
                        HttpStatus.OK.value(), notificationList, null, true, pagination, unreadCount
                );
            });
        });
    }

    @Override
    public Mono<Notification> createNotification(Comment comment, String forUsername) {
        final CommentNotification notification = new CommentNotification();
        notification.setComment(comment);
        notification.setForUsername(forUsername);
        notification.setIsRead(false);
        return repository.save(notification);
    }

    @Override
    public Mono<Notification> createNotification(CommentThread commentThread, String forUsername) {
        final CommentThreadNotification notification = new CommentThreadNotification();
        notification.setCommentThread(commentThread);
        notification.setForUsername(forUsername);
        notification.setIsRead(false);
        return repository.save(notification);
    }
}
