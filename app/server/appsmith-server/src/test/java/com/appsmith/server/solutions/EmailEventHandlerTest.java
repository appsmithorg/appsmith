package com.appsmith.server.solutions;

import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.events.CommentAddedEvent;
import com.appsmith.server.events.CommentThreadClosedEvent;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.UserWorkspaceService;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringJUnit4ClassRunner.class)
@ComponentScan("com.appsmith.server.solutions")
public class EmailEventHandlerTest {

    private static final String COMMENT_ADDED_EMAIL_TEMPLATE = "email/commentAddedTemplate.html";

    @MockBean
    private ApplicationEventPublisher applicationEventPublisher;
    @MockBean
    private EmailSender emailSender;
    @MockBean
    private WorkspaceRepository workspaceRepository;
    @MockBean
    private ApplicationRepository applicationRepository;
    @MockBean
    private NewPageRepository newPageRepository;
    @MockBean
    private EmailConfig emailConfig;
    @MockBean
    private PolicyUtils policyUtils;
    @MockBean
    UserWorkspaceService userWorkspaceService;

    EmailEventHandler emailEventHandler;

    private Application application;
    private Workspace workspace;

    String authorUserName = "abc";
    String originHeader = "efg";
    String applicationId = "application-id";
    String workspaceId = "workspace-id";
    String emailReceiverUsername = "email-receiver";

    @Before
    public void setUp() {

        emailEventHandler = new EmailEventHandlerImpl(applicationEventPublisher, emailSender, workspaceRepository,
                applicationRepository, newPageRepository, policyUtils, emailConfig, userWorkspaceService);

        application = new Application();
        application.setName("Test application for comment");
        application.setWorkspaceId(workspaceId);
        workspace = new Workspace();

        // add a role with email receiver username
        UserRole userRole = new UserRole();
        userRole.setUsername(emailReceiverUsername);
        userRole.setRole(AppsmithRole.ORGANIZATION_ADMIN);
        workspace.setUserRoles(List.of(userRole));

        Mockito.when(applicationRepository.findById(applicationId)).thenReturn(Mono.just(application));
        Mockito.when(workspaceRepository.findById(workspaceId)).thenReturn(Mono.just(workspace));

        NewPage newPage = new NewPage();
        newPage.setUnpublishedPage(new PageDTO());
        newPage.getUnpublishedPage().setName("Page1");
        Mockito.when(newPageRepository.findById(anyString())).thenReturn(Mono.just(newPage));
    }

    @Test
    public void publish_CommentProvidedSubscriberIsNull_ReturnsFalse() {
        Mono<Boolean> booleanMono = emailEventHandler.publish(
                authorUserName, applicationId, new Comment(), originHeader, null
        );
        StepVerifier.create(booleanMono).assertNext(aBoolean -> {
            Assert.assertEquals(Boolean.FALSE, aBoolean);
        }).verifyComplete();
    }

    @Test
    public void publish_CommentProvidedSubscriberIsEmpty_ReturnsFalse() {
        Mono<Boolean> booleanMono = emailEventHandler.publish(
                authorUserName, applicationId, new Comment(), originHeader, Set.of()
        );
        StepVerifier.create(booleanMono).assertNext(aBoolean -> {
            Assert.assertEquals(Boolean.FALSE, aBoolean);
        }).verifyComplete();
    }
}