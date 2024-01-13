package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatcher;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static java.util.Arrays.copyOfRange;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
public class ApplicationSnapshotServiceUnitTest {

    @MockBean
    ApplicationService applicationService;

    @MockBean
    ImportApplicationService importApplicationService;

    @MockBean
    ExportApplicationService exportApplicationService;

    @MockBean
    ApplicationSnapshotRepository applicationSnapshotRepository;

    @Autowired
    ApplicationSnapshotService applicationSnapshotService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    Gson gson;

    @Test
    public void createApplicationSnapshot_WhenApplicationTooLarge_SnapshotCreatedSuccessfully() {
        String defaultAppId = "default-app-id", branchName = "develop", branchedAppId = "branched-app-id";

        // Create a large ApplicationJson object that exceeds the 15 MB size
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", generateRandomString(16));

        Layout layout = new Layout();
        layout.setDsl(jsonObject);

        PageDTO pageDTO = new PageDTO();
        pageDTO.setLayouts(new ArrayList<>());
        pageDTO.getLayouts().add(layout);
        NewPage newPage = new NewPage();
        newPage.setUnpublishedPage(pageDTO);

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setPageList(List.of(newPage));

        Mockito.when(applicationService.findBranchedApplicationId(
                        branchName, defaultAppId, AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(branchedAppId));

        Mockito.when(exportApplicationService.exportApplicationById(
                        branchedAppId, SerialiseApplicationObjective.VERSION_CONTROL))
                .thenReturn(Mono.just(applicationJson));

        Mockito.when(applicationSnapshotRepository.deleteAllByApplicationId(branchedAppId))
                .thenReturn(Mono.just("").then());

        // we're expecting to receive two application snapshots, create a matcher to check the size
        ArgumentMatcher<List<ApplicationSnapshot>> snapshotListHasTwoSnapshot =
                snapshotList -> snapshotList.size() == 2;

        Mockito.when(applicationSnapshotRepository.saveAll(argThat(snapshotListHasTwoSnapshot)))
                .thenReturn(Flux.just(new ApplicationSnapshot(), new ApplicationSnapshot()));

        StepVerifier.create(applicationSnapshotService.createApplicationSnapshot(defaultAppId, branchName))
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isTrue();
                })
                .verifyComplete();
    }

    @Test
    public void restoreSnapshot_WhenSnapshotHasMultipleChunks_RestoredSuccessfully() {
        String defaultAppId = "default-app-id",
                branchedAppId = "branched-app-id",
                workspaceId = "workspace-id",
                branch = "development";

        Application application = new Application();
        application.setName("Snapshot test");
        application.setWorkspaceId(workspaceId);
        application.setId(branchedAppId);

        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(
                        branch, defaultAppId, AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(application));

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(application);

        String jsonString = gson.toJson(applicationJson);
        byte[] jsonStringBytes = jsonString.getBytes(StandardCharsets.UTF_8);

        int chunkSize = jsonStringBytes.length / 3;

        List<ApplicationSnapshot> snapshots = List.of(
                createSnapshot(branchedAppId, copyOfRange(jsonStringBytes, chunkSize * 2, jsonStringBytes.length), 3),
                createSnapshot(branchedAppId, copyOfRange(jsonStringBytes, 0, chunkSize), 1),
                createSnapshot(branchedAppId, copyOfRange(jsonStringBytes, chunkSize, chunkSize * 2), 2));

        Mockito.when(applicationSnapshotRepository.findByApplicationId(branchedAppId))
                .thenReturn(Flux.fromIterable(snapshots));

        // matcher to check that ApplicationJson created from chunks matches the original one
        ArgumentMatcher<ApplicationJson> matchApplicationJson;
        matchApplicationJson = applicationJson1 ->
                applicationJson1.getExportedApplication().getName().equals(application.getName());
        Mockito.when(importApplicationService.restoreSnapshot(
                        eq(application.getWorkspaceId()), argThat(matchApplicationJson), eq(branchedAppId), eq(branch)))
                .thenReturn(Mono.just(application));

        Mockito.when(applicationSnapshotRepository.deleteAllByApplicationId(branchedAppId))
                .thenReturn(Mono.just("application").then());

        StepVerifier.create(applicationSnapshotService.restoreSnapshot(defaultAppId, branch))
                .assertNext(application1 -> {
                    assertThat(application1.getName()).isEqualTo(application.getName());
                })
                .verifyComplete();
    }

    @Test
    public void restoreSnapshot_WhenApplicationHasDefaultPageIds_IdReplacedWithDefaultPageId() {
        String defaultAppId = "default-app-id",
                branchedAppId = "branched-app-id",
                workspaceId = "workspace-id",
                branch = "development";

        Application application = new Application();
        application.setName("Snapshot test");
        application.setWorkspaceId(workspaceId);
        application.setId(branchedAppId);

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId("original-page-id");
        applicationPage.setDefaultPageId("default-page-id");
        applicationPage.setSlug("original-page-slug");
        applicationPage.setIsDefault(true);

        application.setPages(List.of(applicationPage));

        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(
                        branch, defaultAppId, AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(application));

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(application);

        String jsonString = gson.toJson(applicationJson);
        byte[] jsonStringBytes = jsonString.getBytes(StandardCharsets.UTF_8);

        List<ApplicationSnapshot> snapshots = List.of(createSnapshot(branchedAppId, jsonStringBytes, 1));

        Mockito.when(applicationSnapshotRepository.findByApplicationId(branchedAppId))
                .thenReturn(Flux.fromIterable(snapshots));

        Mockito.when(importApplicationService.restoreSnapshot(
                        eq(application.getWorkspaceId()), any(), eq(branchedAppId), eq(branch)))
                .thenReturn(Mono.just(application));

        Mockito.when(applicationSnapshotRepository.deleteAllByApplicationId(branchedAppId))
                .thenReturn(Mono.just("application").then());

        StepVerifier.create(applicationSnapshotService.restoreSnapshot(defaultAppId, branch))
                .assertNext(application1 -> {
                    assertThat(application1.getName()).isEqualTo(application.getName());
                    application1.getPages().forEach(page -> {
                        assertThat(page.getId()).isEqualTo(page.getDefaultPageId());
                    });
                })
                .verifyComplete();
    }

    private ApplicationSnapshot createSnapshot(String applicationId, byte[] data, int chunkOrder) {
        ApplicationSnapshot applicationSnapshot = new ApplicationSnapshot();
        applicationSnapshot.setApplicationId(applicationId);
        applicationSnapshot.setData(data);
        applicationSnapshot.setChunkOrder(chunkOrder);
        return applicationSnapshot;
    }

    private String generateRandomString(int targetStringSizeInMB) {
        int targetSizeInBytes = targetStringSizeInMB * 1024 * 1024;
        int leftLimit = 48; // numeral '0'
        int rightLimit = 122; // letter 'z'
        Random random = new Random();

        String generatedString = random.ints(leftLimit, rightLimit + 1)
                .filter(i -> (i <= 57 || i >= 65) && (i <= 90 || i >= 97))
                .limit(targetSizeInBytes)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();

        return generatedString;
    }

    @Test
    public void restoreSnapshot_WhenApplicationConnectedToGit_ReturnApplicationWithDefaultIds() {
        // create an application object that has git related fields populated
        Application application = new Application();
        application.setId("branched-app-id");
        application.setName("Snapshot test");
        application.setWorkspaceId("workspace-id");
        application.setGitApplicationMetadata(new GitApplicationMetadata());
        application.getGitApplicationMetadata().setDefaultApplicationId("default-app-id");
        application.getGitApplicationMetadata().setBranchName("development");

        // create pages for the application that have git related fields populated
        List<ApplicationPage> pages = new ArrayList<>();
        ApplicationPage page = new ApplicationPage();
        page.setDefaultPageId("default-page-id");
        page.setId("branched-page-id");
        pages.add(page);
        application.setPages(pages);

        // create the application json because we need to mock the snapshot with a byte array of this json
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(application);
        String jsonString = gson.toJson(applicationJson);
        byte[] jsonStringBytes = jsonString.getBytes(StandardCharsets.UTF_8);
        ApplicationSnapshot applicationSnapshot = createSnapshot("branched-app-id", jsonStringBytes, 1);

        // mock so that this application is returned
        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(
                        "development", "default-app-id", applicationPermission.getEditPermission()))
                .thenReturn(Mono.just(application));

        // mock so that this application snapshot is returned when queried with branched application id
        Mockito.when(applicationSnapshotRepository.findByApplicationId("branched-app-id"))
                .thenReturn(Flux.just(applicationSnapshot));

        // mock the import application service to return the application that was passed to it
        Mockito.when(importApplicationService.restoreSnapshot(
                        eq(application.getWorkspaceId()),
                        argThat(applicationJson1 -> applicationJson1
                                .getExportedApplication()
                                .getName()
                                .equals(application.getName())),
                        eq("branched-app-id"),
                        eq("development")))
                .thenReturn(Mono.just(application));

        // mock the delete spanshot to return an empty mono
        Mockito.when(applicationSnapshotRepository.deleteAllByApplicationId("branched-app-id"))
                .thenReturn(Mono.empty());

        StepVerifier.create(applicationSnapshotService.restoreSnapshot("default-app-id", "development"))
                .assertNext(application1 -> {
                    assertThat(application1.getName()).isEqualTo(application.getName());
                    assertThat(application1.getId())
                            .isEqualTo(application.getGitApplicationMetadata().getDefaultApplicationId());
                    assertThat(application1.getPages().get(0).getId())
                            .isEqualTo(application.getPages().get(0).getDefaultPageId());
                })
                .verifyComplete();
    }

    @Test
    public void test() {
        Mono<Integer> mono = Mono.just(1)
                .map(s -> {
                    System.out.println("s at line 296: " + s);
                    if (s == 1) {
                        throw new RuntimeException("equal to 1");
                    }
                    return s;
                })
                .onErrorResume(e -> {
                    System.out.println("error at integer mono on Error resume");
                    return Mono.error(e);
                });

        Mono<String> mono1 = Mono.just("1");

        Mono<String> finalMono = mono.then(mono1)
                .map(s -> {
                    System.out.println("s at line 300: " + s);
                    return s;
                })
                .onErrorResume(e -> {
                    System.out.println("error at final mono on error resume ");
                    return Mono.error(e);
                });
        finalMono.subscribe();
    }
}
