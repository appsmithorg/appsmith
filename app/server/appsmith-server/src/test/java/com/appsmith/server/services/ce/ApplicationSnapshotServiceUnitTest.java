package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

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


    @Test
    public void createApplicationSnapshot_WhenApplicationTooLarge_ExceptionThrown() {
        String defaultAppId = "default-app-id",
                branchName = "develop",
                branchedAppId = "branched-app-id";

        // Create a large ApplicationJson object that exceeds the 15 MB size
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", generateRandomString(15));

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

        Mockito.when(applicationSnapshotRepository.findWithoutData(branchedAppId)).thenReturn(Mono.empty());

        StepVerifier.create(applicationSnapshotService.createApplicationSnapshot(defaultAppId, branchName))
                .verifyErrorMessage(AppsmithError.GENERIC_BAD_REQUEST.getMessage("Application too large for snapshot"));
    }

    @Test
    public void createApplicationSnapshot_WhenApplicationSizeLessThan15Mb_ResponseReceived() {
        String defaultAppId = "default-app-id",
                branchName = "develop",
                branchedAppId = "branched-app-id",
                snapshotId = "snapshot-id";

        // Create a large ApplicationJson object that exceeds the 15 MB size
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("key", generateRandomString(14));

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

        Mockito.when(applicationSnapshotRepository.findWithoutData(branchedAppId)).thenReturn(Mono.empty());

        ApplicationSnapshot applicationSnapshot = new ApplicationSnapshot();
        applicationSnapshot.setId(snapshotId);
        Mockito.when(applicationSnapshotRepository.save(any(ApplicationSnapshot.class))).thenReturn(Mono.just(applicationSnapshot));

        StepVerifier.create(applicationSnapshotService.createApplicationSnapshot(defaultAppId, branchName))
                .assertNext(s -> {
                    assertThat(s).isEqualTo(snapshotId);
                })
                .verifyComplete();
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
