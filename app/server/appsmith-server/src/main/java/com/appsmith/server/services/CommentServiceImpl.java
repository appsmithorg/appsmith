package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class CommentServiceImpl extends BaseService<CommentRepository, Comment, String> implements CommentService {

    private final CommentThreadRepository threadRepository;

    private final SessionUserService sessionUserService;
    private final ApplicationService applicationService;

    public CommentServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            CommentRepository repository,
            AnalyticsService analyticsService,
            CommentThreadRepository threadRepository,
            SessionUserService sessionUserService,
            ApplicationService applicationService
    ) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.threadRepository = threadRepository;
        this.sessionUserService = sessionUserService;
        this.applicationService = applicationService;
    }

    @Override
    public Mono<Comment> create(Comment comment) {
        if (StringUtils.isWhitespace(comment.getAuthorName())) {
            // Error: User can't explicitly set the author name. It will be the currently logged in user.
            return Mono.empty();
        }

        return sessionUserService.getCurrentUser()
                .flatMap(user -> {
                    comment.setAuthorName(user.getName());
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

        return applicationService.findById(applicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(ignored -> sessionUserService.getCurrentUser())
                .zipWhen(user -> threadRepository.save(commentThread))
                .flatMapMany(tuple -> {
                    final User user = tuple.getT1();
                    final CommentThread thread = tuple.getT2();

                    List<Mono<Comment>> saverMonos = new ArrayList<>();

                    if (!CollectionUtils.isEmpty(thread.getComments())) {
                        for (final Comment comment : thread.getComments()) {
                            comment.setId(null);
                            comment.setAuthorName(user.getName());
                            comment.setThreadId(thread.getId());
                            saverMonos.add(repository.save(comment));
                        }
                    }

                    return Flux.merge(saverMonos);
                })
                .collectList()
                .map(comments -> {
                    commentThread.setComments(comments);
                    return commentThread;
                });

    }

}
