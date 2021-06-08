package com.appsmith.server.solutions;

import com.appsmith.server.domains.*;
import com.appsmith.server.events.CommentAddedEvent;
import com.appsmith.server.events.CommentThreadClosedEvent;
import com.appsmith.server.helpers.CommentUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.HashMap;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailEventHandler {
    private static final String COMMENT_ADDED_EMAIL_TEMPLATE = "email/commentAddedTemplate.html";
    private static final String USER_MENTIONED_EMAIL_TEMPLATE = "email/userTaggedInCommentTemplate.html";
    private static final String THREAD_RESOLVED_EMAIL_TEMPLATE = "email/commentResolvedTemplate.html";

    private final ApplicationEventPublisher applicationEventPublisher;
    private final EmailSender emailSender;
    private final OrganizationRepository organizationRepository;
    private final ApplicationRepository applicationRepository;

    public Mono<Boolean> publish(String authorUserName, String applicationId, Comment comment, String originHeader) {
        return applicationRepository.findById(applicationId).flatMap(application -> {
            return organizationRepository.findById(application.getOrganizationId()).flatMap(organization -> {
                applicationEventPublisher.publishEvent(
                        new CommentAddedEvent(authorUserName, organization, application, originHeader, comment)
                );
                return Mono.just(organization);
            });
        }).thenReturn(Boolean.TRUE);
    }

    public Mono<Boolean> publish(String authorUserName, String applicationId, CommentThread thread, String originHeader) {
        return applicationRepository.findById(applicationId).flatMap(application -> {
            return organizationRepository.findById(application.getOrganizationId()).flatMap(organization -> {
                applicationEventPublisher.publishEvent(
                        new CommentThreadClosedEvent(authorUserName, organization, application, originHeader, thread)
                );
                return Mono.just(organization);
            });
        }).thenReturn(Boolean.TRUE);
    }

    @Async
    @EventListener
    public void handle(CommentAddedEvent event) {
        this.sendEmailForComment(
                event.getAuthorUserName(), event.getApplication(), event.getOrganization(),
                event.getComment(), event.getOriginHeader()
        ).subscribeOn(Schedulers.elastic())
        .subscribe();
    }

    @Async
    @EventListener
    public void handle(CommentThreadClosedEvent event) {
        this.sendEmailForComment(
                event.getAuthorUserName(), event.getApplication(), event.getOrganization(),
                event.getCommentThread(), event.getOriginHeader()
        )
        .subscribeOn(Schedulers.elastic())
        .subscribe();
    }

    private Mono<Boolean> getEmailSenderMono(UserRole receiverUserRole, CommentThread commentThread,
                                             String originHeader, Application application, Organization organization) {
        String receiverName = StringUtils.isEmpty(receiverUserRole.getName()) ? "User" : receiverUserRole.getName();
        String receiverEmail = receiverUserRole.getUsername();
        CommentThread.CommentThreadState resolvedState = commentThread.getResolvedState();
        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("App_User_Name", receiverName);
        templateParams.put("Commenter_Name", resolvedState.getAuthorName());
        templateParams.put("Application_Name", application.getName());
        templateParams.put("Organization_Name", organization.getName());
        templateParams.put("inviteUrl", originHeader);

        String emailSubject = String.format(
                "%s has resolved comment in %s", resolvedState.getAuthorName(), application.getName()
        );
        return emailSender.sendMail(receiverEmail, emailSubject, THREAD_RESOLVED_EMAIL_TEMPLATE, templateParams);
    }

    private Mono<Boolean> getEmailSenderMono(UserRole receiverUserRole, Comment comment, String originHeader,
                                             Application application, Organization organization) {
        String receiverName = StringUtils.isEmpty(receiverUserRole.getName()) ? "User" : receiverUserRole.getName();
        String receiverEmail = receiverUserRole.getUsername();

        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("App_User_Name", receiverName);
        templateParams.put("Commenter_Name", comment.getAuthorName());
        templateParams.put("Application_Name", application.getName());
        templateParams.put("Organization_Name", organization.getName());
        templateParams.put("Comment_Body", CommentUtils.getCommentBody(comment));
        templateParams.put("inviteUrl", originHeader);

        String emailTemplate = COMMENT_ADDED_EMAIL_TEMPLATE;
        String emailSubject = String.format(
                "New comment from %s in %s", comment.getAuthorName(), application.getName()
        );

        // check if user has been mentioned in the comment
        if(CommentUtils.isUserMentioned(comment, receiverEmail)) {
            emailTemplate = USER_MENTIONED_EMAIL_TEMPLATE;
            emailSubject = String.format("New comment for you from %s", comment.getAuthorName());
        }
        return emailSender.sendMail(receiverEmail, emailSubject, emailTemplate, templateParams);
    }

    private <E> Mono<Boolean> sendEmailForComment(String authorUserName, Application application, Organization organization,
                                                  E commentDomain, String originHeader) {

        List<Mono<Boolean>> emailMonos = new ArrayList<>();
        for (UserRole userRole : organization.getUserRoles()) {
            if(!authorUserName.equals(userRole.getUsername())) {
                if(commentDomain instanceof Comment) {
                    Comment comment = (Comment)commentDomain;
                    emailMonos.add(
                            getEmailSenderMono(userRole, comment, originHeader, application, organization)
                    );
                } else if(commentDomain instanceof CommentThread) {
                    CommentThread commentThread = (CommentThread) commentDomain;
                    emailMonos.add(
                            getEmailSenderMono(userRole, commentThread, originHeader, application, organization)
                    );
                }
            }
        }
        return Flux.concat(emailMonos).then(Mono.just(Boolean.TRUE));
    }
}
