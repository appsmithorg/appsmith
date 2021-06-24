package com.appsmith.server.solutions;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.UserRole;
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
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailEventHandler {
    private static final String COMMENT_ADDED_EMAIL_TEMPLATE = "email/commentAddedTemplate.html";
//    private static final String USER_MENTIONED_EMAIL_TEMPLATE = "email/userTaggedInCommentTemplate.html";
    private static final String THREAD_RESOLVED_EMAIL_TEMPLATE = "email/commentResolvedTemplate.html";

    private final ApplicationEventPublisher applicationEventPublisher;
    private final EmailSender emailSender;
    private final OrganizationRepository organizationRepository;
    private final ApplicationRepository applicationRepository;

    public Mono<Boolean> publish(String authorUserName, String applicationId, Comment comment, String originHeader, Set<String> subscribers) {
        if(CollectionUtils.isEmpty(subscribers)) {  // no subscriber found, return without doing anything
            return Mono.just(Boolean.FALSE);
        }

        return applicationRepository.findById(applicationId).flatMap(application -> {
            return organizationRepository.findById(application.getOrganizationId()).flatMap(organization -> {
                applicationEventPublisher.publishEvent(
                        new CommentAddedEvent(authorUserName, organization, application, originHeader, comment, subscribers)
                );
                return Mono.just(organization);
            });
        }).thenReturn(Boolean.TRUE);
    }

    public Mono<Boolean> publish(String authorUserName, String applicationId, CommentThread thread, String originHeader) {
        if(CollectionUtils.isEmpty(thread.getSubscribers())) {
            // no subscriber found, return without doing anything
            return Mono.just(Boolean.FALSE);
        }

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
                event.getAuthorUserName(),
                event.getOrganization(),
                event.getComment(),
                event.getOriginHeader(),
                event.getSubscribers()
        ).subscribeOn(Schedulers.elastic())
        .subscribe();
    }

    @Async
    @EventListener
    public void handle(CommentThreadClosedEvent event) {
        this.sendEmailForComment(
                event.getAuthorUserName(),
                event.getOrganization(),
                event.getCommentThread(),
                event.getOriginHeader(),
                event.getCommentThread().getSubscribers()
        )
        .subscribeOn(Schedulers.elastic())
        .subscribe();
    }

    private Mono<Boolean> getEmailSenderMono(UserRole receiverUserRole, CommentThread commentThread,
                                             String originHeader, Organization organization) {
        String receiverName = StringUtils.isEmpty(receiverUserRole.getName()) ? "User" : receiverUserRole.getName();
        String receiverEmail = receiverUserRole.getUsername();
        CommentThread.CommentThreadState resolvedState = commentThread.getResolvedState();
        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("App_User_Name", receiverName);
        templateParams.put("Commenter_Name", resolvedState.getAuthorName());
        templateParams.put("Application_Name", commentThread.getApplicationName());
        templateParams.put("Organization_Name", organization.getName());
        templateParams.put("inviteUrl", originHeader);

        String emailSubject = String.format(
                "%s has resolved comment in %s", resolvedState.getAuthorName(), commentThread.getApplicationName()
        );
        return emailSender.sendMail(receiverEmail, emailSubject, THREAD_RESOLVED_EMAIL_TEMPLATE, templateParams);
    }

    private Mono<Boolean> getEmailSenderMono(UserRole receiverUserRole, Comment comment, String originHeader,
                                             Organization organization) {
        String receiverName = StringUtils.isEmpty(receiverUserRole.getName()) ? "User" : receiverUserRole.getName();
        String receiverEmail = receiverUserRole.getUsername();
        String threadLink = String.format("%s/applications/%s/pages/%s/edit?commentThreadId=%s&isCommentMode=true",
                originHeader, comment.getApplicationId(), comment.getPageId(), comment.getThreadId()
        );

        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("App_User_Name", receiverName);
        templateParams.put("Commenter_Name", comment.getAuthorName());
        templateParams.put("Application_Name", comment.getApplicationName());
        templateParams.put("Organization_Name", organization.getName());
        templateParams.put("Comment_Body", CommentUtils.getCommentBody(comment));
        templateParams.put("inviteUrl", threadLink);

        String emailTemplate = COMMENT_ADDED_EMAIL_TEMPLATE;
        String emailSubject = String.format(
                "New comment from %s in %s", comment.getAuthorName(), comment.getApplicationName()
        );

        // check if user has been mentioned in the comment
        if(CommentUtils.isUserMentioned(comment, receiverEmail)) {
            templateParams.put("Mentioned", true);
            emailSubject = String.format("New comment for you from %s", comment.getAuthorName());
        } else if(Boolean.TRUE.equals(comment.getLeading())) {
            templateParams.put("NewComment", true);
        } else {
            templateParams.put("Replied", true);
        }
        return emailSender.sendMail(receiverEmail, emailSubject, emailTemplate, templateParams);
    }

    private <E> Mono<Boolean> sendEmailForComment(String authorUserName, Organization organization, E commentDomain, String originHeader, Set<String> subscribers) {
        List<Mono<Boolean>> emailMonos = new ArrayList<>();
        for (UserRole userRole : organization.getUserRoles()) {
            if(!authorUserName.equals(userRole.getUsername()) && subscribers.contains(userRole.getUsername())) {
                if(commentDomain instanceof Comment) {
                    Comment comment = (Comment)commentDomain;
                    emailMonos.add(getEmailSenderMono(userRole, comment, originHeader, organization));
                } else if(commentDomain instanceof CommentThread) {
                    CommentThread commentThread = (CommentThread) commentDomain;
                    emailMonos.add(getEmailSenderMono(userRole, commentThread, originHeader, organization));
                }
            }
        }
        return Flux.concat(emailMonos).then(Mono.just(Boolean.TRUE));
    }
}
