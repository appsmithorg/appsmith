package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.solutions.ImportExportApplicationService;
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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
public class ApplicationSnapshotServiceUnitTest {

    @MockBean
    ApplicationService applicationService;

    @MockBean
    ImportExportApplicationService importExportApplicationService;

    @MockBean
    ApplicationSnapshotRepository applicationSnapshotRepository;

    @Autowired
    ApplicationSnapshotService applicationSnapshotService;

    @Autowired
    Gson gson;

    @Test
    public void createApplicationSnapshot_WhenApplicationTooLarge_SnapshotCreatedSuccessfully() {
        String defaultAppId = "default-app-id",
                branchName = "develop",
                branchedAppId = "branched-app-id";

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

        Mockito.when(applicationService.findBranchedApplicationId(branchName, defaultAppId, AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(branchedAppId));

        Mockito.when(importExportApplicationService.exportApplicationById(branchedAppId, SerialiseApplicationObjective.VERSION_CONTROL))
                .thenReturn(Mono.just(applicationJson));

        Mockito.when(applicationSnapshotRepository.deleteAllByApplicationId(branchedAppId))
                .thenReturn(Mono.just("").then());

        // we're expecting to receive two application snapshots, create a matcher to check the size
        ArgumentMatcher<List<ApplicationSnapshot>> snapshotListHasTwoSnapshot = snapshotList -> snapshotList.size() == 2;

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

        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(branch, defaultAppId, AclPermission.MANAGE_APPLICATIONS))
                .thenReturn(Mono.just(application));

        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setExportedApplication(application);

        String jsonString = gson.toJson(applicationJson);
        byte[] jsonStringBytes = jsonString.getBytes(StandardCharsets.UTF_8);

        int chunkSize = jsonStringBytes.length / 3;

        List<ApplicationSnapshot> snapshots = List.of(
                createSnapshot(branchedAppId, copyOfRange(jsonStringBytes, chunkSize*2, jsonStringBytes.length), 3),
                createSnapshot(branchedAppId, copyOfRange(jsonStringBytes, 0, chunkSize), 1),
                createSnapshot(branchedAppId, copyOfRange(jsonStringBytes, chunkSize, chunkSize*2), 2)
        );

        Mockito.when(applicationSnapshotRepository.findByApplicationId(branchedAppId))
                .thenReturn(Flux.fromIterable(snapshots));

        // matcher to check that ApplicationJson created from chunks matches the original one
        ArgumentMatcher<ApplicationJson> matchApplicationJson;
        matchApplicationJson = applicationJson1 -> applicationJson1.getExportedApplication().getName().equals(application.getName());
        Mockito.when(importExportApplicationService.importApplicationInWorkspace(eq(application.getWorkspaceId()), argThat(matchApplicationJson), eq(branchedAppId), eq(branch)))
                .thenReturn(Mono.just(application));

        Mockito.when(applicationSnapshotRepository.deleteAllByApplicationId(branchedAppId))
                .thenReturn(Mono.just("application").then());

        StepVerifier.create(applicationSnapshotService.restoreSnapshot(defaultAppId, branch))
                .assertNext(application1 -> {
                    assertThat(application1.getName()).isEqualTo(application.getName());
                })
                .verifyComplete();
    }

    private ApplicationSnapshot createSnapshot(String applicationId, byte [] data, int chunkOrder) {
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
}
