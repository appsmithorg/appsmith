package com.appsmith.server.solutions.ce;

import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.CommentConstants;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.events.CommentAddedEvent;
import com.appsmith.server.events.CommentThreadClosedEvent;
import com.appsmith.server.helpers.CommentUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.constants.Appsmith.DEFAULT_ORIGIN_HEADER;


@Slf4j
@RequiredArgsConstructor
public class EmailEventHandlerCEImpl implements EmailEventHandlerCE {

    private static final String COMMENT_ADDED_EMAIL_TEMPLATE = "email/commentAddedTemplate.html";

    private final ApplicationEventPublisher applicationEventPublisher;
    private final EmailSender emailSender;
    private final OrganizationRepository organizationRepository;
    private final ApplicationRepository applicationRepository;
    private final NewPageRepository newPageRepository;
    private final PolicyUtils policyUtils;
    private final EmailConfig emailConfig;

    public Mono<Boolean> publish(String authorUserName, String applicationId, Comment comment, String originHeader, Set<String> subscribers) {
        if(CollectionUtils.isEmpty(subscribers)) {  // no subscriber found, return without doing anything
            return Mono.just(Boolean.FALSE);
        }

        return applicationRepository.findById(applicationId)
                .zipWith(newPageRepository.findById(comment.getPageId()).map(
                        newPage -> newPage.getUnpublishedPage().getName())
                )
                .flatMap(objects -> organizationRepository
                        .findById(objects.getT1().getOrganizationId())
                        .map(organization -> {
                            String pagename = objects.getT2();
                            applicationEventPublisher.publishEvent(
                                    new CommentAddedEvent(
                                            organization, objects.getT1(), originHeader, comment, subscribers, pagename
                                    )
                            );
                            return organization;
                        })).thenReturn(Boolean.TRUE);
    }

    public Mono<Boolean> publish(String authorUserName, String applicationId, CommentThread thread, String originHeader) {
        if(CollectionUtils.isEmpty(thread.getSubscribers())) {
            // no subscriber found, return without doing anything
            return Mono.just(Boolean.FALSE);
        }

        return applicationRepository.findById(applicationId)
                .zipWith(newPageRepository.findById(thread.getPageId())
                        .map(newPage -> newPage.getUnpublishedPage().getName())
                )
                .flatMap(objects -> organizationRepository.findById(objects.getT1().getOrganizationId())
                        .map(organization -> {
                            applicationEventPublisher.publishEvent(
                                    new CommentThreadClosedEvent(
                                            authorUserName, organization, objects.getT1(), originHeader, thread, objects.getT2()
                                    )
                            );
                            return organization;
                        })).thenReturn(Boolean.TRUE);
    }

    @Async
    @EventListener
    public void handle(CommentAddedEvent event) {
        this.sendEmailForCommentAdded(
                        event.getOrganization(),
                        event.getApplication(),
                        event.getComment(),
                        event.getOriginHeader(),
                        event.getSubscribers(),
                        event.getPageName()
                ).subscribeOn(Schedulers.elastic())
                .subscribe();
    }

    @Async
    @EventListener
    public void handle(CommentThreadClosedEvent event) {
        this.sendEmailForCommentThreadResolved(
                        event.getAuthorUserName(),
                        event.getOrganization(),
                        event.getApplication(),
                        event.getCommentThread(),
                        event.getOriginHeader(),
                        event.getPageName()
                )
                .subscribeOn(Schedulers.elastic())
                .subscribe();
    }

    private String getCommentThreadLink(Application application, String pageId, String threadId, String username, String originHeader) {
        Boolean canManageApplication = policyUtils.isPermissionPresentForUser(
                application.getPolicies(), MANAGE_APPLICATIONS.getValue(), username
        );
        String urlPostfix = "/edit";
        if (Boolean.FALSE.equals(canManageApplication)) {  // user has no permission to manage application
            urlPostfix = "";
        }

        String branchName = null;
        GitApplicationMetadata gitData = application.getGitApplicationMetadata();
        if (application.getGitApplicationMetadata() != null) {
            application.setId(gitData.getDefaultApplicationId());
            branchName = gitData.getBranchName();
        }

        String baseUrl = originHeader;
        if(StringUtils.isEmpty(originHeader)) {
            baseUrl = DEFAULT_ORIGIN_HEADER;
        }
        if (StringUtils.isEmpty(branchName)) {
            return String.format("%s/applications/%s/pages/%s%s?commentThreadId=%s&isCommentMode=true",
                    baseUrl, application.getId(), pageId, urlPostfix, threadId
            );
        }
        return String.format("%s/applications/%s/pages/%s%s?commentThreadId=%s&isCommentMode=true&branch=%s",
                baseUrl, application.getId(), pageId, urlPostfix, threadId, branchName
        );
    }

    private String getUnsubscribeThreadLink(String threadId, String originHeader) {
        return String.format("%s/unsubscribe/discussion/%s", originHeader, threadId);
    }

    private Mono<Boolean> getResolveThreadEmailSenderMono(UserRole receiverUserRole, CommentThread commentThread,
                                                          String originHeader, Application application, String pageName) {
        String receiverName = StringUtils.isEmpty(receiverUserRole.getName()) ? "User" : receiverUserRole.getName();
        String receiverEmail = receiverUserRole.getUsername();
        CommentThread.CommentThreadState resolvedState = commentThread.getResolvedState();
        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("App_User_Name", receiverName);
        templateParams.put("Commenter_Name", resolvedState.getAuthorName());
        templateParams.put("Application_Name", commentThread.getApplicationName());
        templateParams.put("Page_Name", pageName);

        String pageId = commentThread.getDefaultResources() == null ? commentThread.getPageId() : commentThread.getDefaultResources().getPageId();

        templateParams.put("commentUrl", getCommentThreadLink(
                application,
                pageId,
                commentThread.getId(),
                receiverUserRole.getUsername(),
                originHeader)
        );
        templateParams.put("UnsubscribeLink", getUnsubscribeThreadLink(commentThread.getId(), originHeader));
        templateParams.put("Resolved", true);

        String emailSubject = String.format(
                "%s has resolved comment in %s", resolvedState.getAuthorName(), commentThread.getApplicationName()
        );
        return emailSender.sendMail(receiverEmail, emailSubject, COMMENT_ADDED_EMAIL_TEMPLATE, templateParams);
    }

    private Mono<Boolean> getAddCommentEmailSenderMono(UserRole receiverUserRole, Comment comment, String originHeader,
                                                       Application application, String pagename) {
        String receiverName = StringUtils.isEmpty(receiverUserRole.getName()) ? "User" : receiverUserRole.getName();
        String receiverEmail = receiverUserRole.getUsername();

        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("App_User_Name", receiverName);
        templateParams.put("Commenter_Name", comment.getAuthorName());
        templateParams.put("Application_Name", comment.getApplicationName());
        templateParams.put("Page_Name", pagename);
        templateParams.put("Comment_Body", CommentUtils.getCommentBody(comment));

        String pageId = comment.getDefaultResources() == null ? comment.getPageId() : comment.getDefaultResources().getPageId();

        templateParams.put("commentUrl", getCommentThreadLink(
                application,
                pageId,
                comment.getThreadId(),
                receiverUserRole.getUsername(),
                originHeader)
        );
        templateParams.put("UnsubscribeLink", getUnsubscribeThreadLink(comment.getThreadId(), originHeader));

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
        return emailSender.sendMail(receiverEmail, emailSubject, COMMENT_ADDED_EMAIL_TEMPLATE, templateParams);
    }

    private Mono<Boolean> geBotEmailSenderMono(Comment comment, String originHeader, Organization organization, Application application) {
        Map<String, Object> templateParams = new HashMap<>();
        templateParams.put("App_User_Name", CommentConstants.APPSMITH_BOT_NAME);
        templateParams.put("Commenter_Name", comment.getAuthorName());
        templateParams.put("Application_Name", comment.getApplicationName());
        templateParams.put("Organization_Name", organization.getName());
        templateParams.put("Comment_Body", CommentUtils.getCommentBody(comment));
        templateParams.put("commentUrl", getCommentThreadLink(
                application,
                comment.getDefaultResources().getPageId(),
                comment.getThreadId(),
                CommentConstants.APPSMITH_BOT_USERNAME,
                originHeader)
        );

        templateParams.put("Mentioned", true);
        String emailSubject = String.format("New comment for you from %s", comment.getAuthorName());

        return emailSender.sendMail(
                emailConfig.getSupportEmailAddress(), emailSubject, COMMENT_ADDED_EMAIL_TEMPLATE, templateParams
        );
    }

    private Mono<Boolean> sendEmailForCommentAdded(Organization organization, Application application, Comment comment, String originHeader, Set<String> subscribers, String pagename) {
        List<Mono<Boolean>> emailMonos = new ArrayList<>();
        for (UserRole userRole : organization.getUserRoles()) {
            if(!comment.getAuthorUsername().equals(userRole.getUsername()) && subscribers.contains(userRole.getUsername())) {
                emailMonos.add(getAddCommentEmailSenderMono(userRole, comment, originHeader, application, pagename));
            }
        }

        if(CommentUtils.isUserMentioned(comment, CommentConstants.APPSMITH_BOT_USERNAME)) {
            emailMonos.add(geBotEmailSenderMono(comment, originHeader, organization, application));
        }
        return Flux.concat(emailMonos).then(Mono.just(Boolean.TRUE));
    }

    private Mono<Boolean> sendEmailForCommentThreadResolved(String authorUserName, Organization organization, Application application, CommentThread commentThread, String originHeader, String pageName) {
        List<Mono<Boolean>> emailMonos = new ArrayList<>();
        Set<String> subscribers = commentThread.getSubscribers();
        for (UserRole userRole : organization.getUserRoles()) {
            if(!authorUserName.equals(userRole.getUsername()) && subscribers.contains(userRole.getUsername())) {
                emailMonos.add(getResolveThreadEmailSenderMono(userRole, commentThread, originHeader, application, pageName));
            }
        }
        return Flux.concat(emailMonos).then(Mono.just(Boolean.TRUE));
    }

}
