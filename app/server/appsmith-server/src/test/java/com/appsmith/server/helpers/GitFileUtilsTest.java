package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.domains.ApplicationJson;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.SneakyThrows;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Type;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class GitFileUtilsTest {

    @MockBean
    FileInterface fileInterface;

    @Autowired
    GitFileUtils gitFileUtils;

    private static String filePath = "test_assets/ImportExportServiceTest/valid-application.json";
    private static final Path localRepoPath = Path.of("localRepoPath");

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(
                        new ClassPathResource(filePath),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filePart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filePart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });

        return stringifiedFile
                .map(data -> {
                    Gson gson = new Gson();
                    Type fileType = new TypeToken<ApplicationJson>() {
                    }.getType();
                    return gson.fromJson(data, fileType);
                });
    }

    @SneakyThrows
    @Test
    public void saveApplicationToLocalRepo_allResourcesArePresent_removePublishedResources() {
        ApplicationJson validAppJson = createAppJson(filePath).block();

        Mockito.when(fileInterface.saveApplicationToGitRepo(Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(localRepoPath));

        Mono<Path> resultMono = gitFileUtils.saveApplicationToLocalRepo(Path.of(""), validAppJson, "gitFileTest");

        StepVerifier
                .create(resultMono)
                .assertNext(path -> {
                    validAppJson.getPageList().forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage()).isNotNull();
                        assertThat(newPage.getPublishedPage()).isNull();
                    });
                    validAppJson.getActionList().forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction()).isNotNull();
                        assertThat(newAction.getPublishedAction()).isNull();
                    });
                    validAppJson.getActionCollectionList().forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection()).isNotNull();
                        assertThat(actionCollection.getPublishedCollection()).isNull();
                    });
                })
                .verifyComplete();
    }

    @SneakyThrows
    @Test
    public void reconstructApplicationFromLocalRepo_allResourcesArePresent_getClonedPublishedResources() {
        ApplicationJson applicationJson = createAppJson(filePath).block();
        // Prepare the JSON without published resources
        Map<String, Object> pageRef = new HashMap<>();
        Map<String, Object> actionRef = new HashMap<>();
        Map<String, Object> actionCollectionRef = new HashMap<>();
        applicationJson.getPageList().forEach(newPage -> {
            newPage.setPublishedPage(null);
            pageRef.put(newPage.getUnpublishedPage().getName(), newPage);
        });
        applicationJson.getActionList().forEach(newAction -> {
            newAction.setPublishedAction(null);
            actionRef.put(newAction.getUnpublishedAction().getName(), newAction);
        });
        applicationJson.getActionCollectionList().forEach(actionCollection -> {
            actionCollection.setPublishedCollection(null);
            actionCollectionRef.put(actionCollection.getUnpublishedCollection().getName(), actionCollection);
        });

        ApplicationGitReference applicationReference = new ApplicationGitReference();
        applicationReference.setPages(pageRef);
        applicationReference.setActions(actionRef);
        applicationReference.setActionsCollections(actionCollectionRef);

        Mockito.when(fileInterface.reconstructApplicationReferenceFromGitRepo(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(applicationReference));

        Mono<ApplicationJson> resultMono = gitFileUtils.reconstructApplicationJsonFromGitRepo(
                "orgId", "appId", "repoName", "branch"
        )
                .cache();

        StepVerifier
                .create(resultMono)
                .assertNext(applicationJson1 -> {
                    applicationJson1.getPageList().forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage()).isNotNull();
                        // Both DTOs will not be equal as we are creating a deep copy for the published version from
                        // unpublished version
                        assertThat(newPage.getPublishedPage()).isNotEqualTo(newPage.getUnpublishedPage());

                        // Check if the published versions are deep copy of the unpublished version and updating any
                        // will not affect the other
                        final String unpublishedName = newPage.getUnpublishedPage().getName();
                        newPage.getUnpublishedPage().setName("updatedName");

                        assertThat(newPage.getPublishedPage().getName()).isEqualTo(unpublishedName);
                        assertThat(newPage.getUnpublishedPage().getName()).isNotEqualTo(unpublishedName);
                    });
                    applicationJson1.getActionList().forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction()).isNotNull();
                        assertThat(newAction.getPublishedAction()).isNotEqualTo(newAction.getUnpublishedAction());

                        final String unpublishedName = newAction.getUnpublishedAction().getName();
                        newAction.getUnpublishedAction().setName("updatedName");
                        assertThat(newAction.getPublishedAction().getName()).isEqualTo(unpublishedName);
                        assertThat(newAction.getUnpublishedAction().getName()).isNotEqualTo(unpublishedName);
                    });
                    applicationJson1.getActionCollectionList().forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection()).isNotNull();
                        assertThat(actionCollection.getPublishedCollection()).isNotEqualTo(actionCollection.getUnpublishedCollection());

                        final String unpublishedName = actionCollection.getUnpublishedCollection().getName();
                        actionCollection.getUnpublishedCollection().setName("updatedName");
                        assertThat(actionCollection.getPublishedCollection().getName()).isEqualTo(unpublishedName);
                        assertThat(actionCollection.getUnpublishedCollection().getName()).isNotEqualTo(unpublishedName);
                    });
                })
                .verifyComplete();

    }

}
