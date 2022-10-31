package com.appsmith.server.solutions.ce;

import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.regex.Pattern;

@ExtendWith(SpringExtension.class)
@Slf4j
class RefactoringSolutionCEImplTest {

    RefactoringSolutionCEImpl refactoringSolutionCE;
    @MockBean
    private ObjectMapper objectMapper;
    @MockBean
    private NewPageService newPageService;
    @MockBean
    private NewActionService newActionService;
    @MockBean
    private ActionCollectionService actionCollectionService;
    @MockBean
    private ResponseUtils responseUtils;
    @MockBean
    private LayoutActionService layoutActionService;
    @MockBean
    private ApplicationService applicationService;
    @MockBean
    private AstService astService;
    @MockBean
    private InstanceConfig instanceConfig;

    ObjectMapper mapper = new ObjectMapper();

    private final String preWord = "\\b(";
    private final String postWord = ")\\b";

    @BeforeEach
    public void setUp() {
        refactoringSolutionCE = new RefactoringSolutionCEImpl(objectMapper,
                newPageService,
                newActionService,
                actionCollectionService,
                responseUtils,
                layoutActionService,
                applicationService,
                astService,
                instanceConfig);
    }

    @Test
    void testRefactorNameInDsl_whenRenamingTextWidget_replacesAllReferences() {
        try (InputStream initialStream = this.getClass().getResourceAsStream("refactorDslWithOnlyWidgets.json");
             InputStream finalStream = this.getClass().getResourceAsStream("refactorDslWithOnlyWidgetsWithNewText.json")) {
            assert initialStream != null;
            JsonNode dslAsJsonNode = mapper.readTree(initialStream);
            final String oldName = "Text3";
            Mono<Set<String>> updatesMono = refactoringSolutionCE.refactorNameInDsl(
                    dslAsJsonNode,
                    oldName,
                    "newText",
                    2,
                    Pattern.compile(preWord + oldName + postWord));

            StepVerifier.create(updatesMono)
                    .assertNext(updatedPaths -> {
                        Assertions.assertThat(updatedPaths).hasSize(3);
                        Assertions.assertThat(updatedPaths).containsExactlyInAnyOrder(
                                "Text3.widgetName",
                                "List1.template",
                                "List1.onListItemClick");
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
             InputStream finalStream = this.getClass().getResourceAsStream("refactorDslWithOnlyWidgetsWithNewList.json")) {
            assert initialStream != null;
            JsonNode dslAsJsonNode = mapper.readTree(initialStream);
            final String oldName = "List1";
            Mono<Set<String>> updatesMono = refactoringSolutionCE.refactorNameInDsl(
                    dslAsJsonNode,
                    oldName,
                    "newList",
                    2,
                    Pattern.compile(preWord + oldName + postWord));

            StepVerifier.create(updatesMono)
                    .assertNext(updatedPaths -> {
                        Assertions.assertThat(updatedPaths).hasSize(4);
                        Assertions.assertThat(updatedPaths).containsExactlyInAnyOrder(
                                "List1.widgetName",
                                "List1.template.Text4.text",
                                "List1.template.Image1.image",
                                "List1.template.Text3.text");
                    })
                    .verifyComplete();

            JsonNode finalDslAsJsonNode = mapper.readTree(finalStream);
            Assertions.assertThat(dslAsJsonNode).isEqualTo(finalDslAsJsonNode);

        } catch (IOException e) {
            Assertions.fail("Unexpected IOException", e);
        }
    }

}