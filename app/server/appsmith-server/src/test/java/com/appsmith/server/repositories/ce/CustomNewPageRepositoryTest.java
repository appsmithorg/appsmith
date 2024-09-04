package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.repositories.NewPageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CustomNewPageRepositoryTest {

    @Autowired
    NewPageRepository newPageRepository;

    private NewPage createNewPage() {
        String randomString = UUID.randomUUID().toString();
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("Page " + randomString);
        pageDTO.setLayouts(List.of(new Layout()));
        pageDTO.setSlug("test-page-" + randomString);

        NewPage newPage = new NewPage();
        newPage.setUnpublishedPage(pageDTO);
        newPage.setPublishedPage(new PageDTO());
        return newPage;
    }

    @Test
    void publishPages_WhenIdMatches_Published() {
        List<NewPage> newPages = List.of(createNewPage(), createNewPage(), createNewPage());

        Mono<Tuple2<List<NewPage>, List<NewPage>>> tuple2Mono = newPageRepository
                .saveAll(newPages)
                .map(newPage -> newPage.getId())
                .collectList()
                .flatMap(savedPageIds -> {
                    // publish the first page and second page only
                    return newPageRepository
                            .publishPages(savedPageIds.subList(0, 2), null)
                            .thenReturn(savedPageIds);
                })
                .flatMap(savedPageIds -> {
                    // fetch all the pages in two part so that we can verify that the first two pages are published
                    // and third one not published
                    return Mono.zip(
                            newPageRepository
                                    .findAllById(savedPageIds.subList(0, 2))
                                    .collectList(),
                            newPageRepository
                                    .findAllById(savedPageIds.subList(2, 3))
                                    .collectList());
                });

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    assertThat(objects.getT1()).hasSize(2);
                    assertThat(objects.getT2()).hasSize(1);

                    objects.getT1().forEach(newPage -> {
                        PageDTO publishedPage = newPage.getPublishedPage();
                        PageDTO unpublishedPage = newPage.getUnpublishedPage();

                        assertThat(unpublishedPage).isNotNull();
                        assertThat(publishedPage).isNotNull();
                        assertThat(unpublishedPage.getName()).isEqualTo(publishedPage.getName());
                        assertThat(unpublishedPage.getSlug()).isEqualTo(publishedPage.getSlug());
                        assertThat(unpublishedPage.getLayouts())
                                .hasSize(publishedPage.getLayouts().size());
                    });

                    objects.getT2().forEach(newPage -> {
                        PageDTO publishedPage = newPage.getPublishedPage();
                        PageDTO unpublishedPage = newPage.getUnpublishedPage();

                        assertThat(unpublishedPage).isNotNull();
                        assertThat(publishedPage).isNotNull();
                        assertThat(unpublishedPage.getName()).isNotNull();
                        assertThat(publishedPage.getName()).isNull();

                        assertThat(unpublishedPage.getSlug()).isNotNull();
                        assertThat(publishedPage.getSlug()).isNull();

                        assertThat(unpublishedPage.getLayouts()).hasSize(1);
                        assertThat(publishedPage.getLayouts()).isNull();
                    });
                })
                .verifyComplete();
    }

    @Test
    void findPageWithoutBranchName() {
        StepVerifier.create(newPageRepository.findPageByBranchNameAndBasePageId(
                        null, "pageId", AclPermission.PAGE_CREATE_PAGE_ACTIONS, null))
                .verifyComplete();
    }
}
