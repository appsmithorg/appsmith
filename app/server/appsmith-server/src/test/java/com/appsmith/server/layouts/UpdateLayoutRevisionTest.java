package com.appsmith.server.layouts;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import net.minidev.json.JSONObject;
import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Layout updates with an expected revision: the server refuses the update when the page changed after the read.
 */
@SpringBootTest
class UpdateLayoutRevisionTest {

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    LayoutService layoutService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    ReactiveMongoOperations mongoOperations;

    @Autowired
    PagePermission pagePermission;

    private String workspaceId;

    @BeforeEach
    void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("UpdateLayoutRevisionTest-" + UUID.randomUUID());
        workspaceId = workspaceService
                .create(toCreate, apiUser, Boolean.FALSE)
                .block()
                .getId();
    }

    @AfterEach
    void cleanup() {
        applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspaceId, permission))
                .flatMap(application -> applicationPageService.deleteApplication(application.getId()))
                .collectList()
                .block();
        workspaceService.archiveById(workspaceId).block();
    }

    private PageDTO createPage() {
        Application app = new Application();
        app.setName("UpdateLayoutRevisionTest-" + UUID.randomUUID());
        PageDTO page = new PageDTO();
        page.setName("Page1");
        return applicationPageService
                .createApplication(app, workspaceId)
                .flatMap(application -> {
                    page.setApplicationId(application.getId());
                    return applicationPageService.createPage(page);
                })
                .block();
    }

    private static Layout layoutWithText(String text) {
        Layout layout = new Layout();
        layout.setDsl(new JSONObject(
                Map.of("widgetName", "MainContainer", "widgetId", "0", "type", "CANVAS_WIDGET", "text", text)));
        return layout;
    }

    private String readRevision(PageDTO page) {
        Layout layout = layoutService
                .getLayout(page.getId(), page.getLayouts().get(0).getId(), false)
                .block();
        return layout.getRevision();
    }

    private NewPage storedPage(String pageId) {
        return newPageRepository.findById(pageId).block();
    }

    private static String storedText(NewPage page) {
        return page.getUnpublishedPage().getLayouts().get(0).getDsl().getAsString("text");
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_returnPageRevision_when_layoutIsReadInEditMode() {
        // Given
        PageDTO page = createPage();

        // When
        String revision = readRevision(page);

        // Then
        assertThat(revision)
                .isEqualTo(
                        String.valueOf(storedPage(page.getId()).getUpdatedAt().toEpochMilli()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_updateLayout_when_expectedRevisionMatches() {
        // Given
        PageDTO page = createPage();
        String layoutId = page.getLayouts().get(0).getId();
        String revision = readRevision(page);

        // When
        LayoutDTO result = updateLayoutService
                .updateLayoutWithRevision(
                        page.getId(), page.getApplicationId(), layoutId, layoutWithText("matched"), revision)
                .block();

        // Then
        NewPage stored = storedPage(page.getId());
        assertThat(storedText(stored)).isEqualTo("matched");
        assertThat(result.getRevision())
                .isEqualTo(String.valueOf(stored.getUpdatedAt().toEpochMilli()));
        assertThat(Long.parseLong(result.getRevision())).isGreaterThan(Long.parseLong(revision));
        assertThat(readRevision(page)).isEqualTo(result.getRevision());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_refuseUpdate_when_pageChangedAfterRead() {
        // Given
        PageDTO page = createPage();
        String layoutId = page.getLayouts().get(0).getId();
        String revision = readRevision(page);
        updateLayoutService
                .updateLayout(page.getId(), page.getApplicationId(), layoutId, layoutWithText("other writer"))
                .block();

        // When
        Mono<LayoutDTO> result = updateLayoutService.updateLayoutWithRevision(
                page.getId(), page.getApplicationId(), layoutId, layoutWithText("stale"), revision);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.STALE_LAYOUT_UPDATE);
                    assertThat(((AppsmithException) error).getHttpStatus()).isEqualTo(409);
                })
                .verify();
        assertThat(storedText(storedPage(page.getId()))).isEqualTo("other writer");
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_refuseSecondUpdate_when_sameRevisionIsReused() {
        // Given
        PageDTO page = createPage();
        String layoutId = page.getLayouts().get(0).getId();
        String revision = readRevision(page);
        updateLayoutService
                .updateLayoutWithRevision(
                        page.getId(), page.getApplicationId(), layoutId, layoutWithText("first"), revision)
                .block();

        // When
        Mono<LayoutDTO> result = updateLayoutService.updateLayoutWithRevision(
                page.getId(), page.getApplicationId(), layoutId, layoutWithText("second"), revision);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error ->
                        assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.STALE_LAYOUT_UPDATE))
                .verify();
        assertThat(storedText(storedPage(page.getId()))).isEqualTo("first");
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_refuseSave_when_pageChangedSinceExpectedRevision() {
        // Given
        PageDTO page = createPage();
        NewPage before = storedPage(page.getId());
        PageDTO toWrite = newPageService
                .findPageById(page.getId(), pagePermission.getEditPermission(), false)
                .block();
        // Another save lands between the caller's read and its write.
        mongoOperations
                .updateFirst(
                        new Query(where("_id").is(page.getId())),
                        new Update()
                                .set(
                                        NewPage.Fields.updatedAt,
                                        before.getUpdatedAt().plusMillis(5)),
                        NewPage.class)
                .block();

        // When
        Mono<NewPage> result = newPageService.saveUnpublishedPageIfUnchanged(toWrite, before.getUpdatedAt());

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error ->
                        assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.STALE_LAYOUT_UPDATE))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_matchNoPage_when_conditionalWriteSeesDifferentUpdatedAt() {
        // Given
        PageDTO page = createPage();
        NewPage before = storedPage(page.getId());
        PageDTO toWrite = newPageService
                .findPageById(page.getId(), pagePermission.getEditPermission(), false)
                .block();
        Instant staleExpected = before.getUpdatedAt().minusMillis(1);
        Instant next = before.getUpdatedAt().plusMillis(1);

        // When
        Integer staleMatches = newPageRepository
                .updateUnpublishedPageIfUnchanged(
                        page.getId(), staleExpected, next, toWrite, null, pagePermission.getEditPermission())
                .block();
        Integer currentMatches = newPageRepository
                .updateUnpublishedPageIfUnchanged(
                        page.getId(), before.getUpdatedAt(), next, toWrite, null, pagePermission.getEditPermission())
                .block();

        // Then
        assertThat(staleMatches).isZero();
        assertThat(currentMatches).isEqualTo(1);
        assertThat(storedPage(page.getId()).getUpdatedAt()).isEqualTo(next);
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_updateUnconditionally_when_noExpectedRevision() {
        // Given
        PageDTO page = createPage();
        String layoutId = page.getLayouts().get(0).getId();
        updateLayoutService
                .updateLayout(page.getId(), page.getApplicationId(), layoutId, layoutWithText("other writer"))
                .block();

        // When
        LayoutDTO result = updateLayoutService
                .updateLayoutWithRevision(
                        page.getId(), page.getApplicationId(), layoutId, layoutWithText("unconditional"), null)
                .block();

        // Then
        assertThat(result.getRevision()).isNull();
        assertThat(storedText(storedPage(page.getId()))).isEqualTo("unconditional");
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_setGitSyncId_when_pageHasNoneAndRevisionMatches() {
        // Given
        PageDTO page = createPage();
        String layoutId = page.getLayouts().get(0).getId();
        mongoOperations
                .updateFirst(
                        new Query(where("_id").is(page.getId())),
                        new Update().unset(NewPage.Fields.gitSyncId),
                        NewPage.class)
                .block();
        assertThat(storedPage(page.getId()).getGitSyncId()).isNull();
        String revision = readRevision(page);

        // When
        updateLayoutService
                .updateLayoutWithRevision(
                        page.getId(), page.getApplicationId(), layoutId, layoutWithText("backfill"), revision)
                .block();

        // Then
        assertThat(storedPage(page.getId()).getGitSyncId()).startsWith(page.getApplicationId() + "_");
    }

    private Document rawPage(String pageId) {
        return mongoOperations
                .findOne(
                        new Query(where("_id").is(pageId)),
                        Document.class,
                        mongoOperations.getCollectionName(NewPage.class))
                .block();
    }

    private static Set<String> changedKeys(Document before, Document after) {
        Set<String> keys = new HashSet<>(before.keySet());
        keys.addAll(after.keySet());
        Set<String> changed = new HashSet<>();
        for (String key : keys) {
            if (!Objects.equals(before.get(key), after.get(key))) {
                changed.add(key);
            }
        }
        return changed;
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_changeOnlyUnpublishedPageUpdatedAtAndGitSyncId_when_conditionalWriteSucceeds() {
        // Given
        PageDTO page = createPage();
        String layoutId = page.getLayouts().get(0).getId();
        mongoOperations
                .updateFirst(
                        new Query(where("_id").is(page.getId())),
                        new Update().unset(NewPage.Fields.gitSyncId),
                        NewPage.class)
                .block();
        String revision = readRevision(page);
        Document before = rawPage(page.getId());

        // When
        updateLayoutService
                .updateLayoutWithRevision(
                        page.getId(), page.getApplicationId(), layoutId, layoutWithText("raw check"), revision)
                .block();

        // Then
        Document after = rawPage(page.getId());
        assertThat(changedKeys(before, after))
                .containsExactlyInAnyOrder(
                        NewPage.Fields.unpublishedPage, BaseDomain.Fields.updatedAt, NewPage.Fields.gitSyncId);
        for (String key : List.of("publishedPage", "policyMap", "createdAt", "deletedAt", "applicationId")) {
            assertThat(after.get(key)).as(key).isEqualTo(before.get(key));
        }

        // Inside unpublishedPage only the layouts change. Fields that exist only in the API response, such as
        // the layout revision or user permissions, are not stored.
        Document unpublishedBefore = before.get(NewPage.Fields.unpublishedPage, Document.class);
        Document unpublishedAfter = after.get(NewPage.Fields.unpublishedPage, Document.class);
        assertThat(changedKeys(unpublishedBefore, unpublishedAfter)).containsExactly("layouts");
        Document layoutBefore =
                unpublishedBefore.getList("layouts", Document.class).get(0);
        Document layoutAfter =
                unpublishedAfter.getList("layouts", Document.class).get(0);
        assertThat(layoutAfter.keySet()).doesNotContain("revision", "userPermissions");
        // The update query adds no type hint that the full-document save did not write.
        assertThat(layoutAfter.containsKey("_class")).isEqualTo(layoutBefore.containsKey("_class"));
        assertThat(unpublishedAfter.containsKey("_class")).isEqualTo(unpublishedBefore.containsKey("_class"));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_returnNotFound_when_userCannotEditPage() {
        // Given
        PageDTO page = createPage();
        String layoutId = page.getLayouts().get(0).getId();
        String revision = readRevision(page);
        User otherUser = userService.findByEmail("usertest@usertest.com").block();
        SecurityContextImpl otherContext = new SecurityContextImpl(
                new UsernamePasswordAuthenticationToken(otherUser, null, otherUser.getAuthorities()));

        // When
        Mono<LayoutDTO> result = updateLayoutService
                .updateLayoutWithRevision(
                        page.getId(), page.getApplicationId(), layoutId, layoutWithText("denied"), revision)
                .contextWrite(ReactiveSecurityContextHolder.withSecurityContext(Mono.just(otherContext)));

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND);
                    assertThat(error.getMessage())
                            .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(
                                    FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID, page.getId() + ", " + layoutId));
                })
                .verify();
        assertThat(storedPage(page.getId()).getUpdatedAt().toEpochMilli()).isEqualTo(Long.parseLong(revision));
    }
}
