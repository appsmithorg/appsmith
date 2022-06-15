package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationJson;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
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

import java.lang.reflect.Type;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class GitFileUtilsTest {

    @MockBean
    FileInterface fileInterface;

    @Autowired
    GitFileUtils gitFileUtils;

    private static String filePath = "test_assets/ImportExportServiceTest/valid-application.json";
    private static final Path localRepoPath = Path.of("path").resolve("to").resolve("repo");

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

    @Test
    public void getSerializableResource_allEntitiesArePresentForApplication_keysIncludesSeparator() {
        ApplicationJson validAppJson = createAppJson(filePath).block();
        ApplicationGitReference applicationGitReference = gitFileUtils.createApplicationReference(validAppJson);

        List<String> pageNames = validAppJson.getPageList()
                .stream()
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collect(Collectors.toList());

        List<String> actionNames = validAppJson.getActionList()
                .stream()
                .map(newAction -> newAction.getUnpublishedAction().getValidName().replace(".", "-"))
                .collect(Collectors.toList());

        List<String> collectionNames = validAppJson.getActionCollectionList()
                .stream()
                .map(actionCollection -> actionCollection.getUnpublishedCollection().getName())
                .collect(Collectors.toList());

        Map<String, Object> actions = applicationGitReference.getActions();
        for (Map.Entry<String, Object> entry : actions.entrySet()) {
            assertThat(entry.getKey()).contains(NAME_SEPARATOR);
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String queryName = names[0].replace(".", "-");
            final String pageName = names[1];
            assertThat(actionNames).contains(queryName);
            assertThat(pageNames).contains(pageName);
        }

        Map<String, Object> actionsCollections = applicationGitReference.getActionCollections();
        for (Map.Entry<String, Object> entry : actionsCollections.entrySet()) {
            assertThat(entry.getKey()).contains(NAME_SEPARATOR);
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String collectionName = names[0].replace(".", "-");
            final String pageName = names[1];
            assertThat(collectionNames).contains(collectionName);
            assertThat(pageNames).contains(pageName);
        }

        Map<String, Object> pages = applicationGitReference.getPages();
        for (Map.Entry<String, Object> entry : pages.entrySet()) {
            assertThat(entry.getKey()).doesNotContain(NAME_SEPARATOR);
        }
    }

    @Test
    public void getSerializableResource_withDeletedEntities_excludeDeletedEntities() {
        ApplicationJson validAppJson = createAppJson(filePath).block();

        NewPage deletedPage = validAppJson.getPageList().get(validAppJson.getPageList().size() - 1);
        deletedPage
                .getUnpublishedPage()
                .setDeletedAt(Instant.now());

        NewAction deletedAction = validAppJson.getActionList().get(validAppJson.getActionList().size() - 1);
        deletedAction
                .getUnpublishedAction()
                .setDeletedAt(Instant.now());

        ActionCollection deletedCollection = validAppJson.getActionCollectionList().get(validAppJson.getActionCollectionList().size() - 1);
        deletedCollection
                .getUnpublishedCollection()
                .setDeletedAt(Instant.now());

        ApplicationGitReference applicationGitReference = gitFileUtils.createApplicationReference(validAppJson);

        Map<String, Object> actions = applicationGitReference.getActions();
        for (Map.Entry<String, Object> entry : actions.entrySet()) {
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String queryName = names[0].replace(".", "-");
            assertThat(queryName).isNotEmpty();
            assertThat(deletedAction.getUnpublishedAction().getValidName().replace(".", "-")).isNotEqualTo(queryName);
        }

        Map<String, Object> actionsCollections = applicationGitReference.getActionCollections();
        for (Map.Entry<String, Object> entry : actionsCollections.entrySet()) {
            String[] names = entry.getKey().split(NAME_SEPARATOR);
            final String collectionName = names[0].replace(".", "-");
            assertThat(collectionName).isNotEmpty();
            assertThat(deletedCollection.getUnpublishedCollection().getName()).isNotEqualTo(collectionName);
        }

        Map<String, Object> pages = applicationGitReference.getPages();
        for (Map.Entry<String, Object> entry : pages.entrySet()) {
            assertThat(entry.getKey()).doesNotContain(NAME_SEPARATOR);
            String pageName = entry.getKey();
            assertThat(pageName).isNotEmpty();
            assertThat(deletedPage.getUnpublishedPage().getName()).isNotEqualTo(pageName);
        }
    }

}
