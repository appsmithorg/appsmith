package com.appsmith.server.services;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NotificationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

@RunWith(SpringJUnit4ClassRunner.class)
public class NotificationServiceImplTest {
    private static final String COMMENT_ADDED_EMAIL_TEMPLATE = "email/commentAddedTemplate.html";

    @MockBean SessionUserService sessionUserService;
    @MockBean Scheduler scheduler;
    @MockBean MongoConverter mongoConverter;
    @MockBean ReactiveMongoTemplate reactiveMongoTemplate;
    @MockBean NotificationRepository notificationRepository;
    @MockBean Validator validator;
    @MockBean AnalyticsService analyticsService;
    @MockBean EmailSender emailSender;
    @MockBean OrganizationRepository organizationRepository;
    @MockBean ApplicationRepository applicationRepository;

    private NotificationService notificationService;

    @Before
    public void setUp() {
        notificationService = new NotificationServiceImpl(
                scheduler, validator, mongoConverter, reactiveMongoTemplate, notificationRepository, analyticsService,
                sessionUserService
        );
    }

    @Test
    public void sendEmailForComment_WhenMailSenderReturnsTrue_ReturnsTrue() {
        String fromUserEmail = "nayan@appsmith.com";
        String emailReceiver = "rafiqnayan@appsmith.com";
        String originHeader = "https://example.com";

        Map<String, String> emailTemplateParams = new HashMap<>();
        emailTemplateParams.put("Commenter_User_Name", fromUserEmail);
        emailTemplateParams.put("inviteUrl", originHeader);
        Mockito.when(
                emailSender.sendMail(
                        emailReceiver, "New comment", COMMENT_ADDED_EMAIL_TEMPLATE, emailTemplateParams
                )
        ).thenReturn(Mono.just(Boolean.TRUE));

        Comment comment = new Comment();
        comment.setAuthorUsername(fromUserEmail);
    }
}