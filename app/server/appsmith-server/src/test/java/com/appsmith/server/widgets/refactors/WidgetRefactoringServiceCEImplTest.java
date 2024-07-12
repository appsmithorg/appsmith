package com.appsmith.server.widgets.refactors;

import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@SpringBootTest
class WidgetRefactoringServiceCEImplTest {

    private final String preWord = "\\b(";
    private final String postWord = ")\\b";

    @Autowired
    ActionPermission actionPermission;

    @MockBean
    private NewPageService newPageService;

    @SpyBean
    private AstService astService;

    ObjectMapper mapper = new ObjectMapper();

    @MockBean
    ActionCollectionRepository actionCollectionRepository;

    @Autowired
    WidgetRefactorUtil widgetRefactorUtil;

    @Test
    void testRefactorNameInDsl_whenRenamingTextWidget_replacesAllReferences() {
        try (InputStream initialStream = this.getClass().getResourceAsStream("refactorDslWithOnlyWidgets.json");
                InputStream finalStream =
                        this.getClass().getResourceAsStream("refactorDslWithOnlyWidgetsWithNewText.json")) {
            assert initialStream != null;
            JsonNode dslAsJsonNode = mapper.readTree(initialStream);
            final String oldName = "Text";
            Mono<Set<String>> updatesMono = widgetRefactorUtil.refactorNameInDsl(
                    dslAsJsonNode, oldName, "newText", 2, Pattern.compile(preWord + oldName + postWord));

            StepVerifier.create(updatesMono)
                    .assertNext(updatedPaths -> {
                        Assertions.assertThat(updatedPaths).hasSize(3);
                        Assertions.assertThat(updatedPaths)
                                .containsExactlyInAnyOrder(
                                        "Text.widgetName", "List1.template", "List1.onListItemClick");
                    })
                    .verifyComplete();

            JsonNode finalDslAsJsonNode = mapper.readTree(finalStream);
            Assertions.assertThat(dslAsJsonNode).isEqualTo(finalDslAsJsonNode);

        } catch (IOException e) {
            Assertions.fail("Unexpected IOException", e);
        }
    }

    @Test
    void testRefactorNameInDsl_whenRenamingListWidget_replacesTemplateReferences() {
        try (InputStream initialStream = this.getClass().getResourceAsStream("refactorDslWithOnlyWidgets.json");
                InputStream finalStream =
                        this.getClass().getResourceAsStream("refactorDslWithOnlyWidgetsWithNewList.json")) {
            assert initialStream != null;
            JsonNode dslAsJsonNode = mapper.readTree(initialStream);
            final String oldName = "List1";
            Mono<Set<String>> updatesMono = widgetRefactorUtil.refactorNameInDsl(
                    dslAsJsonNode, oldName, "newList", 2, Pattern.compile(preWord + oldName + postWord));

            StepVerifier.create(updatesMono)
                    .assertNext(updatedPaths -> {
                        Assertions.assertThat(updatedPaths).hasSize(4);
                        Assertions.assertThat(updatedPaths)
                                .containsExactlyInAnyOrder(
                                        "List1.widgetName",
                                        "List1.template.Text4.text",
                                        "List1.template.Image1.image",
                                        "List1.template.Text.text");
                    })
                    .verifyComplete();

            JsonNode finalDslAsJsonNode = mapper.readTree(finalStream);
            Assertions.assertThat(dslAsJsonNode).isEqualTo(finalDslAsJsonNode);

        } catch (IOException e) {
            Assertions.fail("Unexpected IOException", e);
        }
    }
}
