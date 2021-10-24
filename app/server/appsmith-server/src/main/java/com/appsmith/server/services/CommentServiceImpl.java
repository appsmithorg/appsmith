package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.CommentOnboardingState;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentMode;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
import com.appsmith.server.events.CommentNotificationEvent;
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

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_THREAD;
import static com.appsmith.server.constants.CommentConstants.APPSMITH_BOT_NAME;
import static com.appsmith.server.constants.CommentConstants.APPSMITH_BOT_USERNAME;
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
        }).flatMap(user ->
                userDataRepository.findByUserId(user.getId()).map(userData -> {
                    comment.setAuthorPhotoId(userData.getProfilePhotoAssetId());
                    return user;
                })
        );

        return userMono.flatMap(user ->
            threadRepository
                    .findById(threadId, AclPermission.COMMENT_ON_THREAD)
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "comment thread", threadId)))
                    .flatMap(commentThread -> updateThreadOnAddComment(commentThread, comment, user))
                    .flatMap(commentThread -> create(commentThread, user, comment, originHeader))
        );
    }

    /**
     * This method updates a comment thread when a new comment is added in that thread. It does the following:<ul>
     * <li>Marks the thread as unread for users other than the author</li>
     * <li>Mark the thread as unresolved if it's in resolved state</li>
     * <li>Marks the thread as public if someone is tagged in the comment</li></ul>
     * @param commentThread the thread object
     * @param comment the comment object
     * @param user currently logged in user aka author
     * @return updated thread
     */
    private Mono<CommentThread> updateThreadOnAddComment(CommentThread commentThread, Comment comment, User user) {
        commentThread.setViewedByUsers(Set.of(user.getUsername()));
        if(commentThread.getResolvedState() != null && commentThread.getResolvedState().getActive() == TRUE) {
            commentThread.getResolvedState().setActive(FALSE);
        }

        if (CommentUtils.isAnyoneMentioned(comment) && Boolean.TRUE.equals(commentThread.getIsPrivate())) {
            return convertToPublic(commentThread).flatMap(threadRepository::save);
        }
        return threadRepository.save(commentThread);
    }

    /**
     * Converts a private bot thread to a public thread.
     * It sets the isPrivate flag to false, changes the sequence and updates the policy
     * @param commentThread
     * @return
     */
    private Mono<CommentThread> convertToPublic(CommentThread commentThread) {
        return applicationService.findById(commentThread.getApplicationId())
                .zipWith(sequenceService.getNext(CommentThread.class, commentThread.getApplicationId()))
                .map(objects -> {
                    Application application = objects.getT1();
                    commentThread.setSequenceId("#" + objects.getT2());
                    commentThread.setIsPrivate(FALSE);
                    final Set<Policy> policies = new HashSet<>();
                    policies.addAll(policyGenerator.getAllChildPolicies(
                            application.getPolicies(),
                            Application.class,
                            CommentThread.class
                    ));
                    policies.add(policyUtils.generatePolicyFromPermission(
                            Set.of(AclPermission.MANAGE_THREAD),
                            commentThread.getAuthorUsername()
                    ).get(AclPermission.MANAGE_THREAD.getValue()));
                    commentThread.setPolicies(policies);
                    return commentThread;
        });
    }

    private Mono<Comment> create(CommentThread commentThread, User user, Comment comment, String originHeader) {
        comment.setAuthorId(user.getId());
        comment.setThreadId(commentThread.getId());
        comment.setApplicationId(commentThread.getApplicationId());
        comment.setApplicationName(commentThread.getApplicationName());
        comment.setPageId(commentThread.getPageId());
        comment.setOrgId(commentThread.getOrgId());
        comment.setAuthorUsername(user.getUsername());
        String authorName = user.getName() != null ? user.getName() : user.getUsername();
        comment.setAuthorName(authorName);
        comment.setMode(commentThread.getMode());

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

            if (!isPrivateThread) {
                Mono<List<Notification>> commentNotifications = sendCommentNotifications(
                        commentThread.getSubscribers(), savedComment, CommentNotificationEvent.CREATED
                );
                return publishEmail.then(commentNotifications).thenReturn(savedComment);
            } else {
                return publishEmail.thenReturn(savedComment);
            }
        })
        .flatMap(createdComment ->
                analyticsService.sendCreateEvent(createdComment, Map.of("tagged", CommentUtils.isAnyoneMentioned(createdComment)))
        );
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
        return userMono.flatMap(user ->
                userDataRepository.findByUserId(user.getId())
                .defaultIfEmpty(new UserData(user.getId()))
                .zipWith(applicationService.findById(applicationId, AclPermission.COMMENT_ON_APPLICATIONS))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)
                ))
                .flatMap(tuple -> {
                    final UserData userData = tuple.getT1();
                    final Application application = tuple.getT2();

                    // set the profile asset id from user data to comment
                    for(Comment comment : commentThread.getComments()) {
                        comment.setAuthorPhotoId(userData.getProfilePhotoAssetId());
                    }
                    boolean shouldCreateBotThread = policyUtils.isPermissionPresentForUser(
                            application.getPolicies(), MANAGE_APPLICATIONS.getValue(), user.getUsername()
                    ) && !CommentUtils.isAnyoneMentioned(commentThread.getComments().get(0));

                    // check whether this thread should be converted to bot thread
                    if (userData.getCommentOnboardingState() == null || userData.getCommentOnboardingState() == CommentOnboardingState.ONBOARDED) {
                        commentThread.setIsPrivate(shouldCreateBotThread);
                        userData.setCommentOnboardingState(CommentOnboardingState.COMMENTED);
                        return userDataRepository.save(userData).then(
                                saveCommentThread(commentThread, application, user)
                        );
                    }
                    return saveCommentThread(commentThread, application, user);
                })
                .flatMap(thread -> {
                    if(thread.getWidgetType() != null) {
                        return analyticsService.sendCreateEvent(
                                thread, Map.of("widgetType", thread.getWidgetType())
                        );
                    } else {
                        return analyticsService.sendCreateEvent(thread);
                    }
                })
                .flatMapMany(thread -> {
                    List<Mono<Comment>> commentSaverMonos = new ArrayList<>();

                    if (!CollectionUtils.isEmpty(thread.getComments())) {
                        thread.getComments().get(0).setLeading(true);
                        for (final Comment comment : thread.getComments()) {
                            comment.setId(null);
                            commentSaverMonos.add(create(thread, user, comment, originHeader));
                        }
                    }

                    if (TRUE.equals(thread.getIsPrivate())) {
                        // this is the first thread by this user, add a bot comment also
                        commentSaverMonos.add(createBotComment(thread, user, CommentOnboardingState.COMMENTED));
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
                }));
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
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "comment thread", threadId))
                )
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
                                        Mono<Boolean> publishEmailMono = emailEventHandler.publish(
                                                user.getUsername(),
                                                updatedThread.getApplicationId(),
                                                updatedThread,
                                                originHeader
                                        );
                                        return notificationService
                                                .createNotification(updatedThread, CommentNotificationEvent.RESOLVED, user.getUsername())
                                                .then(publishEmailMono).thenReturn(updatedThread);
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
                    if (userData.getCommentOnboardingState() == CommentOnboardingState.COMMENTED) {
                        // update the user data
                        userData.setCommentOnboardingState(CommentOnboardingState.RESOLVED);
                        Mono<UserData> saveUserDataMono = userDataRepository.save(userData);

                        Mono<CommentThread> saveThreadMono = applicationService
                                .getById(resolvedThread.getApplicationId())
                                .flatMap(application -> {
                                    // create a new bot thread
                                    CommentThread commentThread = new CommentThread();
                                    commentThread.setIsPrivate(true);
                                    commentThread.setWidgetType("CANVAS_WIDGET");
                                    CommentThread.Position position = new CommentThread.Position();
                                    position.setTop(100);
                                    position.setLeft(100);
                                    commentThread.setPosition(position);
                                    commentThread.setPageId(resolvedThread.getPageId());
                                    commentThread.setRefId("0");
                                    commentThread.setMode(resolvedThread.getMode());

                                    return saveCommentThread(commentThread, application, user)
                                            .flatMap(savedCommentThread ->
                                                    createBotComment(savedCommentThread, user, CommentOnboardingState.RESOLVED)
                                                            .thenReturn(savedCommentThread)
                                            );
                                });

                        return saveUserDataMono.then(saveThreadMono).thenReturn(TRUE);
                    }
                    return Mono.just(FALSE);
                });
    }

    @Override
    public Mono<List<CommentThread>> getThreadsByApplicationId(CommentThreadFilterDTO commentThreadFilterDTO) {
        return applicationService.findById(commentThreadFilterDTO.getApplicationId(), AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_CURL_COMMAND)))
                .zipWith(sessionUserService.getCurrentUser())
                .flatMap(objects -> {
                    Application application = objects.getT1();
                    User currentUser = objects.getT2();

                    // if user is app viewer, return the comments in published mode only
                    Boolean permissionPresentForUser = policyUtils.isPermissionPresentForUser(
                            application.getPolicies(), MANAGE_APPLICATIONS.getValue(), currentUser.getUsername()
                    );
                    if(!permissionPresentForUser) {
                        // user is app viewer, show only PUBLISHED comment threads
                        commentThreadFilterDTO.setMode(CommentMode.PUBLISHED);
                    }
                    return threadRepository.find(commentThreadFilterDTO, AclPermission.READ_THREAD)
                            .collectList()
                            .flatMap(threads -> {
                                final Map<String, CommentThread> threadsByThreadId = new HashMap<>();

                                for (CommentThread thread : threads) {
                                    thread.setComments(new LinkedList<>());
                                    thread.setIsViewed((thread.getViewedByUsers() != null && thread.getViewedByUsers().contains(currentUser.getUsername()))
                                            || thread.getResolvedState().getActive());
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
                .flatMap(comment -> threadRepository.findById(comment.getThreadId(), READ_THREAD).flatMap(commentThread ->
                    sendCommentNotifications(commentThread.getSubscribers(), comment, CommentNotificationEvent.DELETED)
                            .thenReturn(comment)
                ))
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<CommentThread> deleteThread(String threadId) {
        return threadRepository.findById(threadId, AclPermission.MANAGE_THREAD)
                .flatMap(threadRepository::archive)
                .flatMap(commentThread ->
                    notificationService.createNotification(
                            commentThread, CommentNotificationEvent.DELETED, commentThread.getAuthorUsername()
                    ).collectList().thenReturn(commentThread)
                )
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

            // generate manage permission policy for the author
            Policy managePolicyForCreator = policyUtils.generatePolicyFromPermission(
                    Set.of(AclPermission.MANAGE_THREAD),
                    user
            ).get(AclPermission.MANAGE_THREAD.getValue());

            // merge the policy with existing ones
            policyUtils.addPolicyToExistingSet(policies, managePolicyForCreator);

            commentSeq = sequenceService.getNext(CommentThread.class, application.getId());
        }
        commentThread.setPolicies(policies);
        return commentSeq.map(sequenceNo -> {
            commentThread.setSequenceId("#" + sequenceNo);
            return sequenceNo;
        }).then(threadRepository.save(commentThread));
    }

    private Mono<Comment> createBotComment(CommentThread commentThread, User user, CommentOnboardingState commentOnboardingState) {
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
        Map<String, Comment.Entity> entityMap = new HashMap<>();

        try {
            if (commentOnboardingState == CommentOnboardingState.COMMENTED) {
                block.setText(TemplateUtils.parseTemplate(HOW_TO_TAG_BOT_COMMENT, botCommentParams));
                block.setEntityRanges(List.of(new Comment.Range(92, APPSMITH_BOT_USERNAME.length(), 0)));

                Comment.EntityData entityData = new Comment.EntityData();
                entityData.setMention(new Comment.EntityData.Mention("appsmith", null));
                Comment.Entity commentEntity = new Comment.Entity();
                commentEntity.setType("mention");
                commentEntity.setData(entityData);
                entityMap.put("0", commentEntity);
            } else {
                block.setText(TemplateUtils.parseTemplate(HOW_TO_TAG_USER_COMMENT, botCommentParams));
            }
        } catch (IOException e) {
            throw Exceptions.propagate(e);
        }
        block.setType("unstyled");
        block.setDepth(0);
        body.setEntityMap(entityMap);
        return repository.save(comment);
    }

    @Override
    public Mono<Boolean> unsubscribeThread(String threadId) {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> threadRepository.removeSubscriber(threadId, user.getUsername()))
                .map(result -> result.getModifiedCount() == 1L);
    }

    @Override
    public Mono<Long> getUnreadCount(String applicationId) {
        return sessionUserService.getCurrentUser()
                .flatMap(user ->
                        threadRepository.countUnreadThreads(applicationId, user.getUsername())
                );
    }

    private Mono<List<Notification>> sendCommentNotifications(
            Set<String> subscribers, Comment comment, CommentNotificationEvent event) {
        List<Mono<Notification>> monoList = new ArrayList<>();
        if(subscribers != null) {
            for(String username : subscribers) {
                if(!username.equals(comment.getAuthorUsername())) {
                    // send notifications to everyone except author of the comment and bot
                    Mono<Notification> notificationMono = notificationService.createNotification(
                            comment, event, username
                    );
                    monoList.add(notificationMono);
                }
            }
        }
        return Flux.merge(monoList).collectList();
    }
}
