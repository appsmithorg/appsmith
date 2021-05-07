package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.time.Instant;
import java.util.ArrayList;
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

    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;

    private final PolicyGenerator policyGenerator;
    private final PolicyUtils policyUtils;

    public CommentServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            CommentRepository repository,
            AnalyticsService analyticsService,
            CommentThreadRepository threadRepository,
            SessionUserService sessionUserService,
            ApplicationService applicationService,
            PolicyGenerator policyGenerator,
            PolicyUtils policyUtils
    ) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.threadRepository = threadRepository;
        this.sessionUserService = sessionUserService;
        this.applicationService = applicationService;
        this.policyGenerator = policyGenerator;
        this.policyUtils = policyUtils;
    }

    @Override
    public Mono<Comment> create(String threadId, Comment comment) {
        if (StringUtils.isWhitespace(comment.getAuthorName())) {
            // Error: User can't explicitly set the author name. It will be the currently logged in user.
            return Mono.empty();
        }

        return Mono.zip(
                sessionUserService.getCurrentUser(),
                threadRepository.findById(threadId, AclPermission.COMMENT_ON_THREAD)
        )
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "comment thread", threadId)))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final CommentThread thread = tuple.getT2();

                    comment.setThreadId(threadId);

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
                    comment.setAuthorName(authorName);
                    return repository.save(comment);
                });
    }

    @Override
    public Mono<CommentThread> createThread(CommentThread commentThread) {
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(tuple -> {
                    final User user = tuple.getT1();
                    final Application application = tuple.getT2();

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
                        for (final Comment comment : thread.getComments()) {
                            comment.setId(null);
                            commentSaverMonos.add(create(thread.getId(), comment));
                        }
                    }

                    // Using `concat` here so that the comments are saved one after the other, so that their `createdAt`
                    // value is meaningful.
                    return Flux.concat(commentSaverMonos);
                })
                .collectList()
                .map(comments -> {
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
    public Mono<CommentThread> updateThread(String threadId, CommentThread commentThread) {
        CommentThread.CommentThreadState initState = new CommentThread.CommentThreadState();
        // Copy over only those fields that are allowed to be updated by a PATCH request.
        return sessionUserService.getCurrentUser()
                .flatMap(user -> {
                    String authorName = user.getName() != null ? user.getName(): user.getUsername();
                    initState.setAuthorName(authorName);
                    initState.setAuthorUsername(user.getUsername());
                    //Nested object in mongo doc doesn't update time automatically
                    initState.setUpdatedAt(Instant.now());

                    if (commentThread.getResolvedState() != null) {
                        initState.setActive(commentThread.getResolvedState().getActive());
                        commentThread.setResolvedState(initState);
                    } else if (commentThread.getPinnedState() != null) {
                        initState.setActive(commentThread.getPinnedState().getActive());
                        commentThread.setPinnedState(initState);
                    }

                    Set<String> viewedUser = new HashSet<>();
                    viewedUser.add(user.getUsername());
                    commentThread.setViewedByUsers(viewedUser);
                    commentThread.setIsViewed(true);
                    return threadRepository.findById(threadId);
                })
                .flatMap(thread -> {

                    if(thread.getViewedByUsers() != null) {
                        commentThread.getViewedByUsers().addAll(thread.getViewedByUsers());
                    }
                    return threadRepository.updateById(threadId, commentThread, AclPermission.MANAGE_THREAD);
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

}
