package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentMode;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.CommentThreadFilterDTO;
import com.appsmith.server.dtos.PageDTO;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ApplicationPageServiceTest {
    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    CommentService commentService;

    private CommentThread createCommentThread(CommentMode commentMode, PageDTO pageDTO) {
        CommentThread commentThread = new CommentThread();
        commentThread.setPageId(pageDTO.getId());
        commentThread.setApplicationId(pageDTO.getApplicationId());
        commentThread.setMode(commentMode);
        Comment comment = new Comment();
        commentThread.setComments(List.of(comment));
        return commentThread;
    }

    /**
     * Creates an organization, an application and a page under that application
     * @param uniquePrefix unique string that'll be added as prefix to org and app names to avoid name collision
     * @return publisher of PageDTO
     */
    private Mono<PageDTO> createPageMono(String uniquePrefix) {
        Organization unsavedOrg = new Organization();
        unsavedOrg.setName(uniquePrefix + "_org");
        return organizationService.create(unsavedOrg)
                .flatMap(organization -> {
                    Application application = new Application();
                    application.setName(uniquePrefix + "_app");
                    return applicationPageService.createApplication(application, organization.getId());
                })
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("Test page");
                    page.setApplicationId(application.getId());
                    return applicationPageService.createPage(page);
                });
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteUnpublishedPage_WhenPageDeleted_EditModeCommentsDeleted() {
        Mono<List<CommentThread>> getThreadMono = createPageMono(UUID.randomUUID().toString())
                .flatMap(pageDTO -> {
                    CommentThread editModeCommentThread = createCommentThread(CommentMode.EDIT, pageDTO);
                    CommentThread piublishedModeCommentThread = createCommentThread(CommentMode.PUBLISHED, pageDTO);

                    return commentService.createThread(editModeCommentThread, "app.appsmith.com")
                            .then(commentService.createThread(piublishedModeCommentThread, "app.appsmith.com"))
                            .then(applicationPageService.deleteUnpublishedPage(pageDTO.getId()))
                            .thenReturn(pageDTO);
                }).flatMap(pageDTO -> {
                    CommentThreadFilterDTO filterDTO = new CommentThreadFilterDTO();
                    filterDTO.setApplicationId(pageDTO.getApplicationId());
                    return commentService.getThreadsByApplicationId(filterDTO);
                });

        StepVerifier.create(getThreadMono).assertNext(commentThreads -> {
            assertThat(commentThreads.size()).isEqualTo(1);
            assertThat(commentThreads.get(0).getMode()).isEqualTo(CommentMode.PUBLISHED);
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteUnpublishedPage_WhenPageDeletedAndAppRePublished_PublishModeCommentsDeleted() {
        Mono<List<CommentThread>> getThreadMono = createPageMono(UUID.randomUUID().toString())
                .flatMap(pageDTO -> {
                    CommentThread editModeCommentThread = createCommentThread(CommentMode.EDIT, pageDTO);
                    CommentThread piublishedModeCommentThread = createCommentThread(CommentMode.PUBLISHED, pageDTO);

                    // add a comment thread in edit mode
                    return commentService.createThread(editModeCommentThread, "app.appsmith.com")
                            // publish the app
                            .then(applicationPageService.publish(pageDTO.getApplicationId(), true))
                            // add a comment in published mode
                            .then(commentService.createThread(piublishedModeCommentThread, "app.appsmith.com"))
                            // delete the unpublised page, published page is still available
                            .then(applicationPageService.deleteUnpublishedPage(pageDTO.getId()))
                            // publish the page again, this should delete the published page and comment
                            .then(applicationPageService.publish(pageDTO.getApplicationId(), true))
                            .thenReturn(pageDTO);
                }).flatMap(pageDTO -> {
                    CommentThreadFilterDTO filterDTO = new CommentThreadFilterDTO();
                    filterDTO.setApplicationId(pageDTO.getApplicationId());
                    return commentService.getThreadsByApplicationId(filterDTO);
                });

        StepVerifier.create(getThreadMono).assertNext(commentThreads -> {
            assertThat(commentThreads.size()).isEqualTo(0);
        }).verifyComplete();
    }
}
