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

    @Test
    @WithUserDetails("api_user")
    public void deleteUnpublishedPage_WhenPageDeleted_EditModeCommentsDeleted() {
        Organization unsavedOrg = new Organization();
        unsavedOrg.setName("ApplicationPageServiceTestOrg");

        Mono<List<CommentThread>> getThreadMono = organizationService.create(unsavedOrg)
                .flatMap(organization -> {
                    Application application = new Application();
                    application.setName("ApplicationPageServiceTestApp");
                    return applicationPageService.createApplication(application, organization.getId());
                })
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("Test page");
                    page.setApplicationId(application.getId());
                    return applicationPageService.createPage(page);
                }).flatMap(pageDTO -> {
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
}
