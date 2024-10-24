package com.appsmith.server.git;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.AutoConfigureDataMongo;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith({AfterAllCleanUpExtension.class})
@AutoConfigureDataMongo
@SpringBootTest
public class FileFormatMigrationTests {

    @Autowired
    FileInterface fileInterface;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    GitServiceConfig gitConfig;

    @BeforeEach
    public void setUp() {
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(), Mockito.any())).thenReturn(Mono.just(true));

        Mockito.when(gitConfig.getGitRootPath()).thenReturn("");
    }

    @Test
    public void extractFiles_whenFilesInRepoWithFormatVersion1_success() {
        String version1DirPath = "src/test/resources/test_assets/GitExecutorTests/FileFormatVersions/v1";
        Gson gson = new Gson();
        Mono<ApplicationGitReference> applicationRefMono =
                fileInterface.reconstructApplicationReferenceFromGitRepo(version1DirPath, "", "", "");
        StepVerifier.create(applicationRefMono)
                .assertNext(applicationGitReference -> {
                    assertThat(applicationGitReference.getApplication()).isNotNull();
                    JsonObject jsonObject =
                            gson.fromJson(gson.toJson(applicationGitReference.getApplication()), JsonObject.class);
                    assertThat(jsonObject.get("applicationKey").getAsString()).isEqualTo("applicationValue");

                    jsonObject = gson.fromJson(gson.toJson(applicationGitReference.getMetadata()), JsonObject.class);
                    assertThat(jsonObject.get("key").getAsString()).isEqualTo("value");
                    assertThat(jsonObject.get("fileFormatVersion").getAsInt()).isEqualTo(1);

                    JsonObject pages = gson.fromJson(gson.toJson(applicationGitReference.getPages()), JsonObject.class);
                    assertThat(pages.size()).isEqualTo(1);
                    assertThat(pages.get("Page1.json")
                                    .getAsJsonObject()
                                    .get("pageKey")
                                    .getAsString())
                            .isEqualTo("pageValue");

                    JsonObject actions =
                            gson.fromJson(gson.toJson(applicationGitReference.getActions()), JsonObject.class);
                    assertThat(actions.size()).isEqualTo(1);
                    assertThat(actions.get("Query1_Page1.json")
                                    .getAsJsonObject()
                                    .get("queryKey")
                                    .getAsString())
                            .isEqualTo("queryValue");

                    JsonObject actionCollections = gson.fromJson(
                            gson.toJson(applicationGitReference.getActionCollections()), JsonObject.class);
                    assertThat(actionCollections.size()).isEqualTo(1);
                    assertThat(actionCollections
                                    .get("JSObject1_Page1.json")
                                    .getAsJsonObject()
                                    .get("jsobjectKey")
                                    .getAsString())
                            .isEqualTo("jsobjectValue");

                    JsonObject datasources =
                            gson.fromJson(gson.toJson(applicationGitReference.getDatasources()), JsonObject.class);
                    assertThat(datasources.size()).isEqualTo(1);
                    assertThat(datasources
                                    .get("Datasource1.json")
                                    .getAsJsonObject()
                                    .get("datasourceKey")
                                    .getAsString())
                            .isEqualTo("datasourceValue");
                })
                .verifyComplete();
    }

    @Test
    public void extractFiles_whenFilesInRepoWithFormatVersion2_success() {
        String version1DirPath = "src/test/resources/test_assets/GitExecutorTests/FileFormatVersions/v2";
        Gson gson = new Gson();
        Mono<ApplicationGitReference> applicationRefMono =
                fileInterface.reconstructApplicationReferenceFromGitRepo(version1DirPath, "", "", "");
        StepVerifier.create(applicationRefMono)
                .assertNext(applicationGitReference -> {
                    assertThat(applicationGitReference.getApplication()).isNotNull();
                    JsonObject jsonObject =
                            gson.fromJson(gson.toJson(applicationGitReference.getApplication()), JsonObject.class);
                    assertThat(jsonObject.get("applicationKey").getAsString()).isEqualTo("applicationValue");

                    jsonObject = gson.fromJson(gson.toJson(applicationGitReference.getMetadata()), JsonObject.class);
                    assertThat(jsonObject.get("key").getAsString()).isEqualTo("value");
                    assertThat(jsonObject.get("fileFormatVersion").getAsInt()).isEqualTo(2);

                    JsonObject pages = gson.fromJson(gson.toJson(applicationGitReference.getPages()), JsonObject.class);
                    assertThat(pages.size()).isEqualTo(1);
                    assertThat(pages.get("Page1")
                                    .getAsJsonObject()
                                    .get("pageKey")
                                    .getAsString())
                            .isEqualTo("pageValue");

                    JsonObject actions =
                            gson.fromJson(gson.toJson(applicationGitReference.getActions()), JsonObject.class);
                    assertThat(actions.size()).isEqualTo(1);
                    assertThat(actions.get("Query1.jsonPage1")
                                    .getAsJsonObject()
                                    .get("queryKey")
                                    .getAsString())
                            .isEqualTo("queryValue");

                    JsonObject actionCollections = gson.fromJson(
                            gson.toJson(applicationGitReference.getActionCollections()), JsonObject.class);
                    assertThat(actionCollections.size()).isEqualTo(1);
                    assertThat(actionCollections
                                    .get("JSObject1.jsonPage1")
                                    .getAsJsonObject()
                                    .get("jsobjectKey")
                                    .getAsString())
                            .isEqualTo("jsobjectValue");

                    JsonObject datasources =
                            gson.fromJson(gson.toJson(applicationGitReference.getDatasources()), JsonObject.class);
                    assertThat(datasources.size()).isEqualTo(1);
                    assertThat(datasources
                                    .get("Datasource1.json")
                                    .getAsJsonObject()
                                    .get("datasourceKey")
                                    .getAsString())
                            .isEqualTo("datasourceValue");
                })
                .verifyComplete();
    }
}
