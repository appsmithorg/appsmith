package com.appsmith.server.services;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.NotificationsResponseDTO;
import com.appsmith.server.repositories.NotificationRepository;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.test.StepVerifier;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringJUnit4ClassRunner.class)
public class NotificationServiceImplTest {
    @MockBean
    private Scheduler scheduler;
    @MockBean
    private Validator validator;
    @MockBean
    private MongoConverter mongoConverter;
    @MockBean
    private ReactiveMongoTemplate reactiveMongoTemplate;
    @MockBean
    private NotificationRepository repository;
    @MockBean
    private AnalyticsService analyticsService;
    @MockBean
    private SessionUserService sessionUserService;

    NotificationService notificationService;
    private User currentUser;

    @Before
    public void setUp() {
        notificationService = new NotificationServiceImpl(
                scheduler, validator, mongoConverter, reactiveMongoTemplate,
                repository, analyticsService, sessionUserService
        );
        currentUser = new User();
        currentUser.setEmail("sample-email");

        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(currentUser));
        // mock the repository to return count as 100
        Mockito.when(repository.countByForUsername(currentUser.getUsername())).thenReturn(Mono.just(100L));
        // mock the repository to return unread count as 5
        Mockito.when(repository.countByForUsernameAndIsReadIsTrue(currentUser.getUsername())).thenReturn(Mono.just(5L));
    }

    private List<Notification> createSampleNotificationList(int numberOfSamples) {
        // create some sample notification
        List<Notification> notificationList = new ArrayList<>();
        for(int i = 1; i <= numberOfSamples; i++) {
            Notification notification = new Notification();
            notification.setId("test-id-" + i);
            notificationList.add(notification);
        }
        return notificationList;
    }

    @Test
    public void getAll_WhenNoPaginationParam_ReturnsDefaultPaginatedData() {
        List<Notification> notificationList = createSampleNotificationList(5);

        // mock the repository to return the sample list of notification
        Mockito.when(repository.findByForUsername(eq(currentUser.getUsername()), Mockito.any(Pageable.class))).thenReturn(
                Flux.fromIterable(notificationList)
        );

        Mono<NotificationsResponseDTO> responseDTOMono = notificationService.getAll(new LinkedMultiValueMap<>());
        StepVerifier
                .create(responseDTOMono)
                .assertNext(listResponseDTO -> {
                    Assert.assertEquals(notificationList.size(), listResponseDTO.getData().size());
                    Assert.assertEquals(0, listResponseDTO.getPagination().getCurrentPage());
                    Assert.assertEquals(10, listResponseDTO.getPagination().getPageSize());
                    Assert.assertEquals(100, listResponseDTO.getPagination().getTotalCount());
                    Assert.assertEquals(5, listResponseDTO.getUnreadCount());
                })
                .verifyComplete();
    }

    @Test
    public void getAll_WhenPaginationParamExists_ReturnsPaginatedData() {
        List<Notification> notificationList = createSampleNotificationList(5);

        // mock the repository to return the sample list of notification
        Mockito.when(repository.findByForUsername(eq(currentUser.getUsername()), Mockito.any(Pageable.class))).thenReturn(
                Flux.fromIterable(notificationList)
        );

        // add the sample pagination parameters
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.put("pageNumber", List.of("2")); // fetch page 2
        params.put("pageSize", List.of("8")); // fetch with page size 8

        Mono<NotificationsResponseDTO> responseDTOMono = notificationService.getAll(params);
        StepVerifier
                .create(responseDTOMono)
                .assertNext(listResponseDTO -> {
                    Assert.assertEquals(notificationList.size(), listResponseDTO.getData().size());
                    Assert.assertEquals(2, listResponseDTO.getPagination().getCurrentPage());
                    Assert.assertEquals(8, listResponseDTO.getPagination().getPageSize());
                    Assert.assertEquals(100, listResponseDTO.getPagination().getTotalCount());
                    Assert.assertEquals(5, listResponseDTO.getUnreadCount());
                })
                .verifyComplete();
    }
}