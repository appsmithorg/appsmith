package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
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
    private final EmailSender emailSender;
    private final OrganizationRepository organizationRepository;
    private final ApplicationRepository applicationRepository;

    private static final String COMMENT_ADDED_EMAIL_TEMPLATE = "email/commentAddedTemplate.html";
    private static final String USER_MENTIONED_EMAIL_TEMPLATE = "email/userTaggedInCommentTemplate.html";
    private static final String THREAD_RESOLVED_EMAIL_TEMPLATE = "email/commentResolvedTemplate.html";

    public NotificationServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            NotificationRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            EmailSender emailSender, OrganizationRepository organizationRepository, ApplicationRepository applicationRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.emailSender = emailSender;
        this.organizationRepository = organizationRepository;
        this.applicationRepository = applicationRepository;
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

//    @Override
//    public Mono<Void> sendEmailForComment(Comment comment, String originHeader, String applicationId) {
//        return applicationRepository.findById(applicationId).flatMap(application -> {
//            return organizationRepository.findById(application.getOrganizationId()).flatMap(organization -> {
//                List<Mono<Boolean>> emailMonos = new ArrayList<>();
//                for (UserRole userRole : organization.getUserRoles()) {
//                    if(!comment.getAuthorUsername().equals(userRole.getUsername())) {
//                        String receiverName = StringUtils.isEmpty(userRole.getName()) ? "User" : userRole.getName();
//                        String receiverEmail = userRole.getUsername();
//
//                        Map<String, Object> templateParams = new HashMap<>();
//                        templateParams.put("App_User_Name", receiverName);
//                        templateParams.put("Commenter_Name", comment.getAuthorName());
//                        templateParams.put("Application_Name", application.getName());
//                        templateParams.put("Organization_Name", organization.getName());
//                        templateParams.put("Comment_Body", CommentUtils.getCommentBody(comment));
//                        templateParams.put("inviteUrl", originHeader);
//
//                        String emailTemplate = COMMENT_ADDED_EMAIL_TEMPLATE;
//                        String emailSubject = String.format(
//                                "New comment from %s in %s", comment.getAuthorName(), application.getName()
//                        );
//
//                        // check if user has been mentioned in the comment
//                        if(CommentUtils.isUserMentioned(comment, receiverEmail)) {
//                            emailTemplate = USER_MENTIONED_EMAIL_TEMPLATE;
//                            emailSubject = String.format("New comment for you from %s", comment.getAuthorName());
//                        }
//                        emailMonos.add(
//                                emailSender.sendMail(receiverEmail, emailSubject, emailTemplate, templateParams)
//                        );
//                    }
//                }
//                return Flux.concat(emailMonos).then();
//            });
//        });
//    }
//
//    public Mono<Void> sendEmailForResolveCommentThread(CommentThread commentThread, String originHeader,
//                                                       String applicationId) {
//        return applicationRepository.findById(applicationId).flatMap(application -> {
//            return organizationRepository.findById(application.getOrganizationId()).flatMap(organization -> {
//                List<Mono<Boolean>> emailMonos = new ArrayList<>();
//                CommentThread.CommentThreadState resolvedState = commentThread.getResolvedState();
//                for (UserRole userRole : organization.getUserRoles()) {
//                    if(!resolvedState.getAuthorUsername().equals(userRole.getUsername())) {
//                        String receiverName = StringUtils.isEmpty(userRole.getName()) ? "User" : userRole.getName();
//                        String receiverEmail = userRole.getUsername();
//
//                        Map<String, Object> templateParams = new HashMap<>();
//                        templateParams.put("App_User_Name", receiverName);
//                        templateParams.put("Commenter_Name", resolvedState.getAuthorName());
//                        templateParams.put("Application_Name", application.getName());
//                        templateParams.put("Organization_Name", organization.getName());
//                        templateParams.put("inviteUrl", originHeader);
//
//                        String emailSubject = String.format(
//                                "%s has resolved comment in %s", resolvedState.getAuthorName(), application.getName()
//                        );
//                        emailMonos.add(
//                                emailSender.sendMail(receiverEmail, emailSubject, THREAD_RESOLVED_EMAIL_TEMPLATE, templateParams)
//                        );
//                    }
//                }
//                return Flux.concat(emailMonos).then();
//            });
//        });
//    }

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

    @Override
    public  <E>Mono<Void> sendEmailForComment(String authorUserName, String applicationId, E commentDomain,
                                        String originHeader) {
        return applicationRepository.findById(applicationId).flatMap(application -> {
            return organizationRepository.findById(application.getOrganizationId()).flatMap(organization -> {
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
                return Flux.concat(emailMonos).then();
            });
        });
    }
}
