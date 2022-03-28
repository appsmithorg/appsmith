package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.CommentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RequestMapping(Url.COMMENT_URL)
public class CommentControllerCE extends BaseController<CommentService, Comment, String> {

    @Autowired
    public CommentControllerCE(CommentService service) {
        super(service);
    }

    @Override
    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Comment>> create(@Valid @RequestBody Comment resource,
                                             @RequestParam String threadId,
                                             ServerWebExchange exchange) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return service.create(threadId,
                        resource,
                        exchange.getRequest().getHeaders().getOrigin(),
                        exchange.getRequest().getHeaders().getFirst(FieldName.BRANCH_NAME))
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping("/threads")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<CommentThread>> createThread(@Valid @RequestBody CommentThread resource,
                                                         @RequestHeader(name = "Origin", required = false) String originHeader,
                                                         @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to create resource {}, on branch: {}", resource.getClass().getName(), branchName);
        return service.createThread(resource, originHeader, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("/threads")
    public Mono<ResponseDTO<List<CommentThread>>> getCommentThread(@Valid CommentThreadFilterDTO filterDTO,
                                                                   @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getThreadsByApplicationId(filterDTO, branchName)
                .map(threads -> new ResponseDTO<>(HttpStatus.OK.value(), threads, null));
    }

    @PutMapping("/threads/{threadId}")
    public Mono<ResponseDTO<CommentThread>> updateThread(
            @Valid @RequestBody CommentThread resource,
            @PathVariable String threadId, ServerWebExchange exchange
    ) {
        log.debug("Going to update resource {}", resource.getClass().getName());
        return service.updateThread(threadId, resource, exchange.getRequest().getHeaders().getOrigin())
                .map(updated -> new ResponseDTO<>(HttpStatus.ACCEPTED.value(), updated, null));
    }

    @Override
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<Comment>> delete(@PathVariable String id, String ignoreBranchName) {
        log.debug("Going to delete comment with id: {}", id);
        return service.deleteComment(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @DeleteMapping("/threads/{threadId}")
    public Mono<ResponseDTO<CommentThread>> deleteThread(@PathVariable String threadId) {
        log.debug("Going to delete thread with id: {}", threadId);
        return service.deleteThread(threadId)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @PostMapping("/{commentId}/reactions")
    public Mono<ResponseDTO<Boolean>> createReaction(
            @PathVariable String commentId,
            @Valid @RequestBody Comment.Reaction reaction
    ) {
        log.debug("Going to create reaction on comment with id: {}", commentId);
        return service.createReaction(commentId, reaction)
                .map(isSaved -> new ResponseDTO<>(HttpStatus.OK.value(), isSaved, null));
    }

    @DeleteMapping("/{commentId}/reactions")
    public Mono<ResponseDTO<Boolean>> deleteReaction(
            @PathVariable String commentId,
            @Valid @RequestBody Comment.Reaction reaction
    ) {
        log.debug("Going to delete reaction on comment with id: {}", commentId);
        return service.deleteReaction(commentId, reaction)
                .map(isSaved -> new ResponseDTO<>(HttpStatus.OK.value(), isSaved, null));
    }

    @PostMapping("/threads/{threadId}/unsubscribe")
    public Mono<ResponseDTO<Boolean>> unsubscribeThread(@PathVariable String threadId) {
        log.debug("Going to unsubscribe user from thread {}", threadId);
        return service.unsubscribeThread(threadId)
                .map(updated -> new ResponseDTO<>(HttpStatus.OK.value(), updated, null));
    }

    @GetMapping("/threads/{applicationId}/count/unread")
    public Mono<ResponseDTO<Long>> countUnreadCommentThreads(@PathVariable String applicationId,
                                                             @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getUnreadCount(applicationId, branchName)
                .map(threads -> new ResponseDTO<>(HttpStatus.OK.value(), threads, null));
    }
}
