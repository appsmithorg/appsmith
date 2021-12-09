package com.appsmith.server.services;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.NotificationRepository;
import com.appsmith.server.helpers.ResponseUtils;
import com.mongodb.client.result.UpdateResult;
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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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
    @MockBean
    private ResponseUtils responseUtils;

    NotificationService notificationService;
    private User currentUser;

    @Before
    public void setUp() {
        notificationService = new NotificationServiceImpl(
                scheduler, validator, mongoConverter, reactiveMongoTemplate,
                repository, analyticsService, sessionUserService, responseUtils);
        currentUser = new User();
        currentUser.setEmail("sample-email");

        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(currentUser));
        // mock the repository to return count as 100
        Mockito.when(repository.countByForUsername(currentUser.getUsername())).thenReturn(Mono.just(100L));
        // mock the repository to return unread count as 5
        Mockito.when(repository.countByForUsernameAndIsReadIsFalse(currentUser.getUsername())).thenReturn(Mono.just(5L));
    }

    private List<Notification> createSampleNotificationList() {
        // create some sample notification
        List<Notification> notificationList = new ArrayList<>();
        for(int i = 1; i <= 5; i++) {
            Notification notification = new Notification();
            notification.setId("test-id-" + i);
            notificationList.add(notification);
        }
        return notificationList;
    }

    @Test
    public void get_WhenNoBeforeParamProvided_ReturnsData() {
        List<Notification> notificationList = createSampleNotificationList();

        // mock the repository to return the sample list of notification when called with current time
        Mockito.when(repository.findByForUsernameAndCreatedAtBefore(
                eq(currentUser.getUsername()), Mockito.any(Instant.class), Mockito.any(Pageable.class))
        ).thenReturn(Flux.fromIterable(notificationList));

        Flux<Notification> notificationFlux = notificationService.get(new LinkedMultiValueMap<>());
        StepVerifier
                .create(notificationFlux.collectList())
                .assertNext(listResponseDTO -> {
                    assertThat(listResponseDTO.size()).isEqualTo(notificationList.size());
                })
                .verifyComplete();
    }

    @Test
    public void get_WhenValidBeforeParamExists_ReturnsData() {
        List<Notification> notificationList = createSampleNotificationList();

        Instant instant = Instant.now();

        // mock the repository to return the sample list of notification
        Mockito.when(repository.findByForUsernameAndCreatedAtBefore(
                eq(currentUser.getUsername()), eq(instant), Mockito.any(Pageable.class))
        ).thenReturn(Flux.fromIterable(notificationList));

        // add the sample pagination parameters
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.put("beforeDate", List.of(instant.toString()));

        Flux<Notification> notificationFlux = notificationService.get(params);

        StepVerifier
                .create(notificationFlux.collectList())
                .assertNext(listResponseDTO -> {
                    assertThat(listResponseDTO.size()).isEqualTo(notificationList.size());
                })
                .verifyComplete();
    }

    @Test
    public void get_WhenInvalidValidBeforeParam_ThrowsException() {
        // add the sample pagination parameters
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.put("beforeDate", List.of("abcd"));

        Flux<Notification> notificationFlux = notificationService.get(params);

        StepVerifier
                .create(notificationFlux.collectList())
                .expectErrorMessage(AppsmithError.INVALID_PARAMETER.getMessage("as beforeDate"))
                .verify();
    }

    @Test
    public void updateIsRead_WhenUpdateAll_ReturnSuccessfully() {
        UpdateIsReadNotificationDTO dto = new UpdateIsReadNotificationDTO();
        dto.setIsRead(true);

        Mockito.when(repository.updateIsReadByForUsername(currentUser.getUsername(), true)).thenReturn(
                Mono.just(Mockito.mock(UpdateResult.class))
        );

        StepVerifier
                .create(notificationService.updateIsRead(dto))
                .assertNext(responseDTO -> {
                    assertThat(responseDTO.getIsRead()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void updateIsRead_WhenUpdateById_ReturnSuccessfully() {
        UpdateIsReadNotificationByIdDTO dto = new UpdateIsReadNotificationByIdDTO();
        dto.setIsRead(true);
        dto.setIdList(List.of("sample-id-1", "sample-id-2", "sample-id-3"));

        Mockito.when(repository.updateIsReadByForUsernameAndIdList(
                currentUser.getUsername(), dto.getIdList(), true)
        ).thenReturn(
                Mono.just(Mockito.mock(UpdateResult.class))
        );

        StepVerifier
                .create(notificationService.updateIsRead(dto))
                .assertNext(responseDTO -> {
                    assertThat(responseDTO.getIsRead()).isTrue();
                    assertThat(responseDTO.getIdList()).isEqualTo(dto.getIdList());
                })
                .verifyComplete();
    }
}