package com.appsmith.server.services;

import com.appsmith.server.domains.*;
import com.appsmith.server.helpers.CommentUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NotificationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        return sessionUserService.getCurrentUser()
                .flatMapMany(user -> repository.findByForUsername(user.getUsername()));
    }
}
