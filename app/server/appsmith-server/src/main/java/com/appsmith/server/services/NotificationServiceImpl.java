package com.appsmith.server.services;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.QNotification;
import com.appsmith.server.dtos.PaginationDTO;
import com.appsmith.server.dtos.ResponseDTO;
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
    public Mono<ResponseDTO<List<Notification>>> getAll(MultiValueMap<String, String> params) {
        Sort sort = Sort.by(Sort.Direction.DESC, QNotification.notification.createdAt.getMetadata().getName());
        PageRequest pageRequest = getPageRequestFromParams(params, 10, sort);

        return sessionUserService.getCurrentUser().flatMap(user -> {
            Mono<Tuple2<List<Notification>, Long>> tuple2Mono = repository.findByForUsername(
                    user.getUsername(), pageRequest).collectList()
                    .zipWith(repository.countByForUsername(user.getUsername()));

            return tuple2Mono.map(objects -> {
                List<Notification> notificationList = objects.getT1();
                Long resultCount = objects.getT2();
                PaginationDTO pagination = new PaginationDTO(
                        pageRequest.getPageNumber(), pageRequest.getPageSize(), resultCount
                );
                return new ResponseDTO<> (
                        HttpStatus.OK.value(), notificationList, null, true, pagination
                );
            });
        });
    }
}
