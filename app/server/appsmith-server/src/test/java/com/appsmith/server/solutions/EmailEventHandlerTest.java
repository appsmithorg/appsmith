package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.events.CommentAddedEvent;
import com.appsmith.server.events.CommentThreadClosedEvent;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringJUnit4ClassRunner.class)
public class EmailEventHandlerTest {

    private static final String COMMENT_ADDED_EMAIL_TEMPLATE = "email/commentAddedTemplate.html";
    private static final String USER_MENTIONED_EMAIL_TEMPLATE = "email/userTaggedInCommentTemplate.html";
    private static final String THREAD_RESOLVED_EMAIL_TEMPLATE = "email/commentResolvedTemplate.html";

    @MockBean
    private ApplicationEventPublisher applicationEventPublisher;
    @MockBean
    private EmailSender emailSender;
    @MockBean
    private OrganizationRepository organizationRepository;
    @MockBean
    private ApplicationRepository applicationRepository;

    EmailEventHandler emailEventHandler;
    private Application application;
    private Organization organization;

    String authorUserName = "abc";
    String originHeader = "efg";
    String applicationId = "application-id";
    String organizationId = "organization-id";
    String emailReceiverUsername = "email-receiver";

    @Before
    public void setUp() {
        emailEventHandler = new EmailEventHandler(
                applicationEventPublisher, emailSender, organizationRepository, applicationRepository
        );
        application = new Application();
        application.setName("Test application for comment");
        application.setOrganizationId(organizationId);
        organization = new Organization();

        // add a role with email receiver username
        UserRole userRole = new UserRole();
        userRole.setUsername(emailReceiverUsername);
        organization.setUserRoles(List.of(userRole));

        Mockito.when(applicationRepository.findById(applicationId)).thenReturn(Mono.just(application));
        Mockito.when(organizationRepository.findById(organizationId)).thenReturn(Mono.just(organization));
    }

    @Test
    public void publish_CommentProvidedWithSubscriber_ReturnsTrue() {
        Comment comment = new Comment();
        Set<String> subscribers = Set.of("dummy-username1");
        CommentAddedEvent commentAddedEvent = new CommentAddedEvent(
                authorUserName, organization, application, originHeader, comment, subscribers
        );

        Mockito.doNothing().when(applicationEventPublisher).publishEvent(commentAddedEvent);

        Mono<Boolean> booleanMono = emailEventHandler.publish(
                authorUserName, applicationId, comment, originHeader, subscribers
        );
        StepVerifier.create(booleanMono).assertNext(aBoolean -> {
            Assert.assertEquals(Boolean.TRUE, aBoolean);
        }).verifyComplete();
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

    @Test
    public void publish_WhenCommentThreadHasNoPublishersProvided_ReturnsFalse() {
        CommentThread commentThread = new CommentThread();
        CommentThreadClosedEvent commentThreadClosedEvent = new CommentThreadClosedEvent(
                authorUserName, organization, application, originHeader, commentThread
        );
        Mockito.doNothing().when(applicationEventPublisher).publishEvent(commentThreadClosedEvent);

        Mono<Boolean> booleanMono = emailEventHandler.publish(authorUserName, applicationId, commentThread, originHeader);
        StepVerifier.create(booleanMono).assertNext(aBoolean -> {
            Assert.assertEquals(Boolean.FALSE, aBoolean);
        }).verifyComplete();
    }

    @Test
    public void publish_WhenCommentThreadHasPublishersProvided_ReturnsTrue() {
        CommentThread commentThread = new CommentThread();
        commentThread.setSubscribers(Set.of("abc"));
        CommentThreadClosedEvent commentThreadClosedEvent = new CommentThreadClosedEvent(
                authorUserName, organization, application, originHeader, commentThread
        );
        Mockito.doNothing().when(applicationEventPublisher).publishEvent(commentThreadClosedEvent);

        Mono<Boolean> booleanMono = emailEventHandler.publish(authorUserName, applicationId, commentThread, originHeader);
        StepVerifier.create(booleanMono).assertNext(aBoolean -> {
            Assert.assertEquals(Boolean.TRUE, aBoolean);
        }).verifyComplete();
    }

    @Test
    public void handle_WhenValidCommentAddedEvent_SendEmailCalled() {
        Comment sampleComment = new Comment();
        sampleComment.setAuthorUsername(authorUserName);
        sampleComment.setAuthorName("Test Author");
        sampleComment.setApplicationName(application.getName());
        Set<String> subscribers = Set.of(emailReceiverUsername);

        // send the event
        CommentAddedEvent commentAddedEvent = new CommentAddedEvent(
                authorUserName, organization, application, originHeader, sampleComment, subscribers
        );
        emailEventHandler.handle(commentAddedEvent);

        String expectedEmailSubject = String.format(
                "New comment from %s in %s", sampleComment.getAuthorName(), application.getName()
        );
        // check email sender was called with expected template and subject
        Mockito.verify(emailSender, Mockito.times(1)).sendMail(
                eq(emailReceiverUsername), eq(expectedEmailSubject), eq(COMMENT_ADDED_EMAIL_TEMPLATE), Mockito.anyMap()
        );
    }

    @Test
    public void handle_WhenSubscriberDoesNotMatch_SendEmailNotCalled() {
        Comment sampleComment = new Comment();
        sampleComment.setAuthorUsername(authorUserName);
        sampleComment.setAuthorName("Test Author");
        Set<String> subscribers = Set.of("test-subscriber-1");

        // send the event
        CommentAddedEvent commentAddedEvent = new CommentAddedEvent(
                authorUserName, organization, application, originHeader, sampleComment, subscribers
        );
        emailEventHandler.handle(commentAddedEvent);

        String expectedEmailSubject = String.format(
                "New comment from %s in %s", sampleComment.getAuthorName(), application.getName()
        );
        // check email sender was called with expected template and subject
        Mockito.verify(emailSender, Mockito.times(0)).sendMail(
                anyString(), anyString(), anyString(), Mockito.anyMap()
        );
    }

    private Map<String, Comment.Entity> createEntityMapForUsers(List<String> mentionedUserNames) {
        Map<String, Comment.Entity> entityMap = new HashMap<>();
        for (String username: mentionedUserNames) {
            Comment.EntityData.EntityUser entityUser = new Comment.EntityData.EntityUser();
            entityUser.setUsername(username);
            Comment.EntityData.Mention mention = new Comment.EntityData.Mention();
            mention.setUser(entityUser);

            Comment.EntityData entityData = new Comment.EntityData();
            entityData.setMention(mention);

            Comment.Entity entity = new Comment.Entity();
            entity.setType("mention");
            entity.setData(entityData);
            entityMap.put(username, entity);
        }
        return entityMap;
    }

    @Test
    public void handle_WhenUserMentionedEvent_ReturnsTrue() {
        Comment sampleComment = new Comment();
        sampleComment.setAuthorUsername(authorUserName);
        sampleComment.setAuthorName("Test Author");
        Set<String> subscribers = Set.of(emailReceiverUsername);

        // mention the emailReceiverUsername in the sample comment
        Map<String, Comment.Entity> entityMap = createEntityMapForUsers(List.of(emailReceiverUsername));
        Comment.Body body = new Comment.Body();
        body.setEntityMap(entityMap);
        sampleComment.setBody(body);

        // send the event
        CommentAddedEvent commentAddedEvent = new CommentAddedEvent(
                authorUserName, organization, application, originHeader, sampleComment, subscribers
        );
        emailEventHandler.handle(commentAddedEvent);

        // check if expectation meets
        String expectedEmailSubject = String.format("New comment for you from %s", sampleComment.getAuthorName());

        // check email sender was called with expected template and subject
        Mockito.verify(emailSender, Mockito.times(1)).sendMail(
                eq(emailReceiverUsername), eq(expectedEmailSubject), eq(USER_MENTIONED_EMAIL_TEMPLATE), Mockito.anyMap()
        );
    }

    @Test
    public void handle_WhenThreadClosed_ReturnsTrue() {
        // add comment thread with a resolved state where resolver is `authorUserName`
        String resolverName = "Test Author";
        CommentThread.CommentThreadState resolveState = new CommentThread.CommentThreadState();
        resolveState.setAuthorUsername(authorUserName);
        resolveState.setAuthorName(resolverName);
        resolveState.setActive(true);

        CommentThread commentThread = new CommentThread();
        commentThread.setResolvedState(resolveState);
        commentThread.setSubscribers(Set.of(emailReceiverUsername));
        commentThread.setApplicationName(application.getName());

        // send the event
        CommentThreadClosedEvent commentAddedEvent = new CommentThreadClosedEvent(
                authorUserName, organization, application, originHeader, commentThread
        );
        emailEventHandler.handle(commentAddedEvent);

        // check if expectation meets
        String expectedEmailSubject = String.format(
                "%s has resolved comment in %s", resolveState.getAuthorName(), application.getName()
        );
        // check email sender was called with expected template and subject
        Mockito.verify(emailSender, Mockito.times(1)).sendMail(
                eq(emailReceiverUsername), eq(expectedEmailSubject), eq(THREAD_RESOLVED_EMAIL_TEMPLATE), Mockito.anyMap()
        );
    }
}