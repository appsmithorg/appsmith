package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.CommentBotEvent;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CommentUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.TemplateUtils;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.solutions.EmailEventHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.Appsmith.APPSMITH_BOT_NAME;
import static com.appsmith.server.constants.Appsmith.APPSMITH_BOT_USERNAME;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
public class CommentServiceImpl extends BaseService<CommentRepository, Comment, String> implements CommentService {

    private static final String HOW_TO_TAG_USER_COMMENT = "bot/howToTagUser.html";
    private static final String HOW_TO_TAG_BOT_COMMENT = "bot/howToTagBot.html";

    private final CommentThreadRepository threadRepository;
    private final UserDataRepository userDataRepository;

    private final UserService userService;
    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;
    private final NotificationService notificationService;

    private final PolicyGenerator policyGenerator;
    private final PolicyUtils policyUtils;
    private final EmailEventHandler emailEventHandler;
    private final SequenceService sequenceService;

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
            EmailEventHandler emailEventHandler,
            UserDataRepository userDataRepository, SequenceService sequenceService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.threadRepository = threadRepository;
        this.userService = userService;
        this.sessionUserService = sessionUserService;
        this.applicationService = applicationService;
        this.notificationService = notificationService;
        this.policyGenerator = policyGenerator;
        this.policyUtils = policyUtils;
        this.emailEventHandler = emailEventHandler;
        this.userDataRepository = userDataRepository;
        this.sequenceService = sequenceService;
    }

    @Override
    public Mono<Comment> create(String threadId, Comment comment, String originHeader) {
        if (StringUtils.isWhitespace(comment.getAuthorName())) {
            // Error: User can't explicitly set the author name. It will be the currently logged in user.
            return Mono.empty();
        }

        final Mono<User> userMono = sessionUserService.getCurrentUser().flatMap(user -> {
            if (user.getId() == null) {
                return userService.findByEmail(user.getEmail());
            } else {
                return Mono.just(user);
            }
        });
        return userMono.zipWith(threadRepository.findById(threadId, AclPermission.COMMENT_ON_THREAD))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "comment thread", threadId)))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final CommentThread thread = tuple.getT2();
                    return create(thread, user, comment, originHeader, true);
                });
    }

    private Mono<Comment> create(CommentThread commentThread, User user, Comment comment, String originHeader, boolean shouldCreateNotification) {
        comment.setAuthorId(user.getId());
        comment.setThreadId(commentThread.getId());
        comment.setApplicationId(commentThread.getApplicationId());
        comment.setApplicationName(commentThread.getApplicationName());
        comment.setPageId(commentThread.getPageId());
        comment.setOrgId(commentThread.getOrgId());

        final Set<Policy> policies = policyGenerator.getAllChildPolicies(
                commentThread.getPolicies(),
                CommentThread.class,
                Comment.class
        );
        policies.add(policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.MANAGE_COMMENT),
                user
        ).get(AclPermission.MANAGE_COMMENT.getValue()));
        comment.setPolicies(policies);

        String authorName = user.getName() != null ? user.getName() : user.getUsername();
        comment.setAuthorUsername(user.getUsername());
        comment.setAuthorName(authorName);

        Mono<Comment> commentMono;
        if (!TRUE.equals(commentThread.getIsPrivate())) {
            Set<String> subscribersFromThisComment = CommentUtils.getSubscriberUsernames(comment);
            // add them to current thread so that we don't need to query again
            if (commentThread.getSubscribers() != null) {
                commentThread.getSubscribers().addAll(subscribersFromThisComment);
            } else {
                commentThread.setSubscribers(subscribersFromThisComment);
            }
            commentMono = threadRepository.addToSubscribers(commentThread.getId(), subscribersFromThisComment)
                    .then(repository.save(comment));
        } else {
            commentMono = repository.save(comment);
        }

        return commentMono.flatMap(savedComment -> {
            boolean isPrivateThread = TRUE.equals(commentThread.getIsPrivate());
            Mono<Boolean> publishEmail = emailEventHandler.publish(
                    comment.getAuthorUsername(),
                    commentThread.getApplicationId(),
                    comment,
                    originHeader,
                    commentThread.getSubscribers()
            );

            if (shouldCreateNotification && !isPrivateThread) {
                final Set<String> usernames = commentThread.getSubscribers();
                List<Mono<Notification>> notificationMonos = new ArrayList<>();
                for (String username : usernames) {
                    if (!username.equals(user.getUsername()) && !username.equals(APPSMITH_BOT_USERNAME)) {
                        Mono<Notification> notificationMono = notificationService.createNotification(
                                savedComment, username
                        );
                        notificationMonos.add(notificationMono);
                    }
                }
                return publishEmail.then(Flux.merge(notificationMonos).then(Mono.just(savedComment)));
            } else {
                return publishEmail.thenReturn(savedComment);
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
        final Mono<User> userMono = sessionUserService.getCurrentUser().flatMap(user -> {
            if (user.getId() == null) {
                return userService.findByEmail(user.getEmail());
            } else {
                return Mono.just(user);
            }
        });
        return userMono.flatMap(user -> {
            return userDataRepository.findByUserId(user.getId())
                    .defaultIfEmpty(new UserData(user.getId()))
                    .zipWith(applicationService.findById(applicationId, AclPermission.COMMENT_ON_APPLICATIONS))
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)
                    ))
                    .flatMap(tuple -> {
                        final UserData userData = tuple.getT1();
                        final Application application = tuple.getT2();
                        // check whether this thread should be converted to bot thread
                        if (userData.getLatestCommentEvent() == null) {
                            commentThread.setIsPrivate(true);
                            userData.setLatestCommentEvent(CommentBotEvent.COMMENTED);
                            return userDataRepository.save(userData).then(
                                    saveCommentThread(commentThread, application, user)
                            );
                        }
                        return saveCommentThread(commentThread, application, user);
                    })
                    .flatMapMany(thread -> {
                        List<Mono<Comment>> commentSaverMonos = new ArrayList<>();

                        if (!CollectionUtils.isEmpty(thread.getComments())) {
                            thread.getComments().get(0).setLeading(true);
                            boolean isFirst = true;
                            for (final Comment comment : thread.getComments()) {
                                comment.setId(null);
                                commentSaverMonos.add(create(thread, user, comment, originHeader, !isFirst));
                                isFirst = false;
                            }
                        }

                        if (TRUE.equals(thread.getIsPrivate())) {
                            // this is the first thread by this user, add a bot comment also
                            commentSaverMonos.add(createBotComment(thread, user, CommentBotEvent.COMMENTED));
                        }
                        // Using `concat` here so that the comments are saved one after the other, so that their `createdAt`
                        // value is meaningful.
                        return Flux.concat(commentSaverMonos);
                    })
                    .collectList()
                    .map(commentList -> {
                        commentThread.setComments(commentList);
                        commentThread.setIsViewed(true);
                        return commentThread;
                    });
        });
    }

    @Override
    public Mono<Comment> update(String id, Comment comment) {
        return repository.updateById(id, comment, AclPermission.MANAGE_COMMENT)
                .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<CommentThread> updateThread(String threadId, CommentThread commentThread, String originHeader) {
        return sessionUserService.getCurrentUser().flatMap(user -> {
            if (user.getId() == null) {
                return userService.findByEmail(user.getEmail());
            } else {
                return Mono.just(user);
            }
        }).zipWith(threadRepository.findById(threadId, AclPermission.READ_THREAD))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "comment thread", threadId)))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final CommentThread threadFromDb = tuple.getT2();

                    String authorName = user.getName() != null ? user.getName() : user.getUsername();

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
                                if (resolvedState != null && resolvedState.getActive()) {
                                    if (Boolean.TRUE.equals(updatedThread.getIsPrivate())) {
                                        return triggerBotThreadResolved(threadFromDb, user).thenReturn(updatedThread);
                                    } else {
                                        return emailEventHandler.publish(
                                                user.getUsername(),
                                                updatedThread.getApplicationId(),
                                                updatedThread,
                                                originHeader
                                        ).thenReturn(updatedThread);
                                    }
                                }
                                return Mono.just(updatedThread);
                            });
                });
    }

    private Mono<Boolean> triggerBotThreadResolved(CommentThread resolvedThread, User user) {
        return userDataRepository.findByUserId(user.getId())
                .defaultIfEmpty(new UserData(user.getId()))
                .flatMap(userData -> {
                    if (userData.getLatestCommentEvent() == CommentBotEvent.COMMENTED) {
                        // update the user data
                        userData.setLatestCommentEvent(CommentBotEvent.RESOLVED);
                        Mono<UserData> saveUserDataMono = userDataRepository.save(userData);

                        Mono<CommentThread> saveThreadMono = applicationService.getById(resolvedThread.getApplicationId())
                                .flatMap(application -> {
                                    // create a new bot thread
                                    CommentThread commentThread = new CommentThread();
                                    commentThread.setIsPrivate(true);
                                    CommentThread.Position position = new CommentThread.Position();
                                    position.setTop(0.558882236480713f);
                                    position.setLeft(73.5241470336914f);
                                    commentThread.setPosition(position);
                                    commentThread.setPageId(resolvedThread.getPageId());
                                    commentThread.setRefId(resolvedThread.getRefId());
                                    commentThread.setMode(resolvedThread.getMode());

                                    return saveCommentThread(commentThread, application, user)
                                            .flatMap(savedCommentThread ->
                                                    createBotComment(savedCommentThread, user, CommentBotEvent.RESOLVED)
                                                            .thenReturn(savedCommentThread)
                                            );
                                });

                        return saveUserDataMono.then(saveThreadMono).thenReturn(TRUE);
                    }
                    return Mono.just(FALSE);
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
                        if (thread.getViewedByUsers() != null && thread.getViewedByUsers().contains(user.getUsername())) {
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

    private Mono<CommentThread> saveCommentThread(CommentThread commentThread, Application application, User user) {
        CommentThread.CommentThreadState initState = new CommentThread.CommentThreadState();
        initState.setActive(false);
        initState.setAuthorName("");
        initState.setAuthorUsername("");

        commentThread.setOrgId(application.getOrganizationId());
        commentThread.setPinnedState(initState);
        commentThread.setResolvedState(initState);
        commentThread.setApplicationId(application.getId());
        commentThread.setApplicationName(application.getName());

        commentThread.setAuthorName(user.getName());
        commentThread.setAuthorUsername(user.getUsername());
        commentThread.setViewedByUsers(Set.of(user.getUsername()));

        final Set<Policy> policies = new HashSet<>();
        Mono<Long> commentSeq;
        if (TRUE.equals(commentThread.getIsPrivate())) {
            Collection<Policy> policyCollection = policyUtils.generatePolicyFromPermission(
                    Set.of(AclPermission.MANAGE_THREAD, AclPermission.COMMENT_ON_THREAD),
                    user
            ).values();
            policies.addAll(policyCollection);
            commentSeq = Mono.just(0L);
        } else {
            policies.addAll(policyGenerator.getAllChildPolicies(
                    application.getPolicies(),
                    Application.class,
                    CommentThread.class
            ));
            policies.add(policyUtils.generatePolicyFromPermission(
                    Set.of(AclPermission.MANAGE_THREAD),
                    user
            ).get(AclPermission.MANAGE_THREAD.getValue()));
            commentSeq = sequenceService.getNext(CommentThread.class, application.getId());
        }
        commentThread.setPolicies(policies);
        return commentSeq.map(sequenceNo -> {
            commentThread.setSequenceId("#" + sequenceNo);
            return sequenceNo;
        }).then(threadRepository.save(commentThread));
    }

    private Mono<Comment> createBotComment(CommentThread commentThread, User user, CommentBotEvent commentBotEvent) {
        final Comment comment = new Comment();
        comment.setThreadId(commentThread.getId());
        comment.setAuthorName(APPSMITH_BOT_NAME);
        comment.setAuthorUsername(APPSMITH_BOT_USERNAME);
        comment.setApplicationId(commentThread.getApplicationId());
        comment.setOrgId(commentThread.getOrgId());

        final Set<Policy> policies = policyGenerator.getAllChildPolicies(
                commentThread.getPolicies(),
                CommentThread.class,
                Comment.class
        );
        policies.add(policyUtils.generatePolicyFromPermission(
                Set.of(AclPermission.MANAGE_COMMENT),
                user
        ).get(AclPermission.MANAGE_COMMENT.getValue()));
        comment.setPolicies(policies);

        Comment.Block block = new Comment.Block();
        Comment.Body body = new Comment.Body();
        body.setBlocks(List.of(block));
        comment.setBody(body);

        block.setKey("key1");
        Map<String, String> botCommentParams = new HashMap<>();
        botCommentParams.put("AppsmithBotName", APPSMITH_BOT_NAME);
        botCommentParams.put("AppsmithBotUserName", APPSMITH_BOT_USERNAME);
        try {
            if (commentBotEvent == CommentBotEvent.COMMENTED) {
                block.setText(TemplateUtils.parseTemplate(HOW_TO_TAG_BOT_COMMENT, botCommentParams));
            } else {
                block.setText(TemplateUtils.parseTemplate(HOW_TO_TAG_USER_COMMENT, botCommentParams));
            }
        } catch (IOException e) {
            throw Exceptions.propagate(e);
        }
        block.setType("unstyled");
        block.setDepth(0);
        body.setEntityMap(new HashMap<>());
        return repository.save(comment);
    }

    /**
     * This method is used to trigger a BotEvent for the provided user.
     * If this event is already handled i.e. present in UserData.commentBotEvents, it'll be ignored.
     * Otherwise, it'll do the required actions e.g. create a bot thread or comment.
     * It'll also update the UserData.commentBotEvents after the action.
     *
     * @param user        User for whom this event is triggered
     * @param userComment
     * @return A Void Mono
     */
    private Mono<Void> triggerCommentEvent(User user, Comment userComment) {
        final CommentBotEvent event;
        if (CommentUtils.isAnyoneMentioned(userComment)) {
            event = CommentBotEvent.TAGGED;
        } else {
            event = CommentBotEvent.COMMENTED;
        }

        return userDataRepository.findByUserId(user.getId()).flatMap(userData -> {
//            if(userData.getLatestCommentEvent() == null
//                    || userData.getLatestCommentEvent().getOrder() < event.getOrder()) {
//                // no event stored yet or current event is with higher order -> trigger this event
//                userData.setLatestCommentEvent(event);
//
//                return threadRepository.findPrivateThread(userComment.getApplicationId())
//                        .switchIfEmpty(updateBotThread(userComment.getApplicationId(), userComment.getPageId(), user))
//                        .flatMap(savedBotThread ->
//                            createBotComment(savedBotThread, user, event).map(savedBotComment -> {
//                                savedBotThread.setComments(List.of(savedBotComment));
//                                return savedBotComment;
//                            }).thenReturn(savedBotThread)
//                ).then(userDataRepository.save(userData)).then();
//            }
            return Mono.empty();
        });
    }
    @Override
    public Mono<Long> getUnreadCount(String applicationId) {
        return sessionUserService.getCurrentUser()
                .flatMap(user ->
                        threadRepository.countUnreadThreads(applicationId, user.getUsername())
                );
    }
}
