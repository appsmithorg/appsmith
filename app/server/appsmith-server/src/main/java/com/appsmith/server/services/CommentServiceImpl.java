package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CommentUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.solutions.EmailEventHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class CommentServiceImpl extends BaseService<CommentRepository, Comment, String> implements CommentService {

    private final CommentThreadRepository threadRepository;

    private final UserService userService;
    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;
    private final NotificationService notificationService;

    private final PolicyGenerator policyGenerator;
    private final PolicyUtils policyUtils;
    private final EmailEventHandler emailEventHandler;

    public CommentServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            CommentRepository repository,
            AnalyticsService analyticsService,
            CommentThreadRepository threadRepository,
            UserService userService,
            SessionUserService sessionUserService,
            ApplicationService applicationService,
            NotificationService notificationService,
            PolicyGenerator policyGenerator,
            PolicyUtils policyUtils,
            EmailEventHandler emailEventHandler) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.threadRepository = threadRepository;
        this.userService = userService;
        this.sessionUserService = sessionUserService;
        this.applicationService = applicationService;
        this.notificationService = notificationService;
        this.policyGenerator = policyGenerator;
        this.policyUtils = policyUtils;
        this.emailEventHandler = emailEventHandler;
    }

    @Override
    public Mono<Comment> create(String threadId, Comment comment, String originHeader) {
        return create(threadId, comment, originHeader, true);
    }

    private Mono<Comment> create(String threadId, Comment comment, String originHeader, boolean shouldCreateNotification) {
        if (StringUtils.isWhitespace(comment.getAuthorName())) {
            // Error: User can't explicitly set the author name. It will be the currently logged in user.
            return Mono.empty();
        }

        final Mono<User> userMono = sessionUserService.getCurrentUser()
                .flatMap(user -> {
                    if (user.getId() == null) {
                        return userService.findByEmail(user.getEmail());
                    } else {
                        return Mono.just(user);
                    }
                });

        final Mono<CommentThread> threadMono = threadRepository.findById(threadId, AclPermission.COMMENT_ON_THREAD);

        return Mono.zip(userMono, threadMono)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "comment thread", threadId)))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final CommentThread thread = tuple.getT2();

                    comment.setAuthorId(user.getId());
                    comment.setThreadId(threadId);
                    comment.setApplicationId(thread.getApplicationId());
                    comment.setApplicationName(thread.getApplicationName());
                    comment.setPageId(thread.getPageId());

                    final Set<Policy> policies = policyGenerator.getAllChildPolicies(
                            thread.getPolicies(),
                            CommentThread.class,
                            Comment.class
                    );
                    policies.add(policyUtils.generatePolicyFromPermission(
                            Set.of(AclPermission.MANAGE_COMMENT),
                            user
                    ).get(AclPermission.MANAGE_COMMENT.getValue()));
                    comment.setPolicies(policies);

                    String authorName = user.getName() != null ? user.getName(): user.getUsername();
                    comment.setAuthorUsername(user.getUsername());
                    comment.setAuthorName(authorName);
                    Set<String> subscribersFromThisComment = CommentUtils.getSubscriberUsernames(comment);

                    // add them to current thread so that we don't need to query again
                    if(thread.getSubscribers() != null) {
                        thread.getSubscribers().addAll(subscribersFromThisComment);
                    } else {
                        thread.setSubscribers(subscribersFromThisComment);
                    }

                    return Mono.zip(
                            Mono.just(user),
                            Mono.just(thread),
                            repository.save(comment),
                            threadRepository.addToSubscribers(threadId, subscribersFromThisComment)
                    );
                })
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    CommentThread commentThread = tuple.getT2();
                    final Comment savedComment = tuple.getT3();
                    Mono<Boolean> publishEmailMono = emailEventHandler.publish(
                            comment.getAuthorUsername(),
                            commentThread.getApplicationId(),
                            comment,
                            originHeader,
                            commentThread.getSubscribers()
                    );

                    if (shouldCreateNotification) {
                        final Set<String> usernames = commentThread.getSubscribers();
                        List<Mono<Notification>> notificationMonos = new ArrayList<>();
                        for (String username : usernames) {
                            if (!username.equals(user.getUsername())) {
                                Mono<Notification> notificationMono = notificationService.createNotification(
                                        savedComment, username
                                );
                                notificationMonos.add(notificationMono);
                            }
                        }
                        return Flux.concat(notificationMonos).then(publishEmailMono).thenReturn(savedComment);
                    } else {
                        return publishEmailMono.thenReturn(savedComment);
                    }
                });
    }

    @Override
    public Mono<CommentThread> createThread(CommentThread commentThread, String originHeader) {
        // 1. Check if this user has permission on the application given by `commentThread.applicationId`.
        // 2. Save the comment thread and get it's id. This is the `threadId`.
        // 3. Pull the comment out of the list of comments, set it's `threadId` and save it separately.
        // 4. Populate the new comment's ID into the CommentThread object sent as response.
        final String applicationId = commentThread.getApplicationId();
        CommentThread.CommentThreadState initState = new CommentThread.CommentThreadState();
        initState.setActive(false);
        initState.setAuthorName("");
        initState.setAuthorUsername("");

        commentThread.setPinnedState(initState);
        commentThread.setResolvedState(initState);

        //TODO : Use sequenceDB for optimised results here
        Query query = new Query();
        query.addCriteria(Criteria.where("applicationId").is(applicationId));
        return mongoTemplate
                .count(query, CommentThread.class)
                .flatMap(count -> {
                    count += 1;
                    commentThread.setSequenceId("#" + count);
                    return Mono.zip(
                            sessionUserService.getCurrentUser(),
                            applicationService.findById(applicationId, AclPermission.COMMENT_ON_APPLICATIONS)
                    );
                })
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)
                ))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final Application application = tuple.getT2();
                    commentThread.setApplicationName(application.getName());
                    commentThread.setAuthorName(user.getName());
                    commentThread.setAuthorUsername(user.getUsername());

                    final Set<Policy> policies = policyGenerator.getAllChildPolicies(
                            application.getPolicies(),
                            Application.class,
                            CommentThread.class
                    );
                    policies.add(policyUtils.generatePolicyFromPermission(
                            Set.of(AclPermission.MANAGE_THREAD),
                            user
                    ).get(AclPermission.MANAGE_THREAD.getValue()));

                    commentThread.setPolicies(policies);

                    Set<String> viewedUser = new HashSet<>();
                    viewedUser.add(user.getUsername());
                    commentThread.setViewedByUsers(viewedUser);
                    return threadRepository.save(commentThread);
                })
                .flatMapMany(thread -> {
                    List<Mono<Comment>> commentSaverMonos = new ArrayList<>();

                    if (!CollectionUtils.isEmpty(thread.getComments())) {
                        thread.getComments().get(0).setLeading(true);
                        boolean isFirst = true;
                        for (final Comment comment : thread.getComments()) {
                            comment.setId(null);
                            commentSaverMonos.add(create(thread.getId(), comment, originHeader, !isFirst));
                            isFirst = false;
                        }
                    }

                    // Using `concat` here so that the comments are saved one after the other, so that their `createdAt`
                    // value is meaningful.
                    return Flux.concat(commentSaverMonos);
                })
                .collectList()
                .zipWith(sessionUserService.getCurrentUser())
                .map(tuple -> {
                    final List<Comment> comments = tuple.getT1();
                    commentThread.setComments(comments);
                    commentThread.setIsViewed(true);
                    return commentThread;
                });
    }

    @Override
    public Mono<Comment> update(String id, Comment comment) {
        return repository.updateById(id, comment, AclPermission.MANAGE_COMMENT)
                .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<CommentThread> updateThread(String threadId, CommentThread commentThread, String originHeader) {
        return Mono.zip(
                sessionUserService.getCurrentUser(),
                // Resolving, pinning and marking as read don't need manage permission on the thread.
                threadRepository.findById(threadId, AclPermission.READ_THREAD)
        )
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "comment thread", threadId)))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final CommentThread threadFromDb = tuple.getT2();

                    String authorName = user.getName() != null ? user.getName(): user.getUsername();

                    if (commentThread.getResolvedState() != null) {
                        CommentThread.CommentThreadState state = new CommentThread.CommentThreadState();
                        state.setAuthorName(authorName);
                        state.setAuthorUsername(user.getUsername());
                        state.setUpdatedAt(Instant.now());
                        state.setActive(commentThread.getResolvedState().getActive());
                        commentThread.setResolvedState(state);
                    }

                    if (commentThread.getPinnedState() != null) {
                        CommentThread.CommentThreadState state = new CommentThread.CommentThreadState();
                        state.setAuthorName(authorName);
                        state.setAuthorUsername(user.getUsername());
                        state.setUpdatedAt(Instant.now());
                        state.setActive(commentThread.getPinnedState().getActive());
                        commentThread.setPinnedState(state);
                    }

                    final Boolean isViewed = commentThread.getIsViewed();
                    if (isViewed != null) {
                        commentThread.setViewedByUsers(threadFromDb.getViewedByUsers());
                        if (isViewed) {
                            if (CollectionUtils.isEmpty(commentThread.getViewedByUsers())) {
                                commentThread.setViewedByUsers(new HashSet<>());
                            }
                            commentThread.getViewedByUsers().add(user.getUsername());
                        } else if (!CollectionUtils.isEmpty(commentThread.getViewedByUsers())) {
                            commentThread.getViewedByUsers().remove(user.getUsername());
                        }
                    }

                    return threadRepository
                            .updateById(threadId, commentThread, AclPermission.READ_THREAD)
                            .flatMap(updatedThread -> {
                                updatedThread.setIsViewed(true);
                                // send email if comment thread is resolved
                                CommentThread.CommentThreadState resolvedState = commentThread.getResolvedState();
                                if(resolvedState != null && resolvedState.getActive()) {
                                    return emailEventHandler.publish(
                                            user.getUsername(),
                                            updatedThread.getApplicationId(),
                                            updatedThread,
                                            originHeader
                                    ).thenReturn(updatedThread);
                                } else {
                                    return Mono.just(updatedThread);
                                }
                            });
                });
    }

    @Override
    public Mono<List<CommentThread>> getThreadsByApplicationId(String applicationId) {
        return threadRepository.findByApplicationId(applicationId, AclPermission.READ_THREAD)
                .collectList()
                .flatMap(threads -> Mono.zip(
                        Mono.just(threads),
                        sessionUserService.getCurrentUser()
                ))
                .flatMap(tuple -> {
                    List<CommentThread> threads = tuple.getT1();
                    User user = tuple.getT2();
                    final Map<String, CommentThread> threadsByThreadId = new HashMap<>();

                    for (CommentThread thread : threads) {
                        thread.setComments(new LinkedList<>());
                        if(thread.getViewedByUsers() != null && thread.getViewedByUsers().contains(user.getUsername())) {
                            thread.setIsViewed(true);
                        } else {
                            thread.setIsViewed(false);
                        }
                        threadsByThreadId.put(thread.getId(), thread);
                    }

                    return repository.findByThreadIdInOrderByCreatedAt(new ArrayList<>(threadsByThreadId.keySet()))
                            // TODO: Can we use `doOnSuccess` here?
                            .map(comment -> {
                                threadsByThreadId.get(comment.getThreadId()).getComments().add(comment);
                                return comment;
                            })
                            .then()
                            .thenReturn(threads);
                });
    }

    /**
     * This function performs a soft delete for the comment.
     *
     * @param id The comment id to be deleted
     * @return The modified comment object with the deleted flag set
     */
    @Override
    public Mono<Comment> deleteComment(String id) {
        return repository.findById(id, AclPermission.MANAGE_COMMENT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.COMMENT, id)))
                .flatMap(repository::archive)
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<CommentThread> deleteThread(String threadId) {
        return threadRepository.findById(threadId, AclPermission.MANAGE_THREAD)
                .flatMap(threadRepository::archive)
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<Boolean> createReaction(String commentId, Comment.Reaction reaction) {
        return Mono.zip(
                repository.findById(commentId, AclPermission.READ_COMMENT),
                sessionUserService.getCurrentUser()
        )
                .flatMap(tuple -> {
                    final User user = tuple.getT2();

                    reaction.setByUsername(user.getUsername());
                    reaction.setByName(user.getName());
                    reaction.setCreatedAt(new Date(Instant.now().toEpochMilli()));

                    return repository.pushReaction(commentId, reaction)
                            .map(result -> result.getModifiedCount() == 1L);
                });
    }

    @Override
    public Mono<Boolean> deleteReaction(String commentId, Comment.Reaction reaction) {
        return Mono.zip(
                repository.findById(commentId, AclPermission.READ_COMMENT),
                sessionUserService.getCurrentUser()
        )
                .flatMap(tuple -> {
                    final User user = tuple.getT2();
                    reaction.setByUsername(user.getUsername());
                    return repository.deleteReaction(commentId, reaction)
                            .map(result -> result.getModifiedCount() > 0);
                });
    }

}
