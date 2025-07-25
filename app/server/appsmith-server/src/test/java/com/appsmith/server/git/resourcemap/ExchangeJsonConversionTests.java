package com.appsmith.server.git.resourcemap;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.external.git.models.GitResourceIdentity;
import com.appsmith.external.git.models.GitResourceMap;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.git.resourcemap.templates.contexts.ExchangeJsonContext;
import com.appsmith.server.git.resourcemap.templates.providers.ExchangeJsonTestTemplateProvider;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.ClassPathResource;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ExchangeJsonConversionTests {

    @Autowired
    @RegisterExtension
    public ExchangeJsonTestTemplateProvider templateProvider;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    @Autowired
    CommonGitFileUtils commonGitFileUtils;

    @SpyBean
    FSGitHandler fsGitHandler;

    @TestTemplate
    public void testConvertArtifactJsonToGitResourceMap_whenArtifactIsFullyPopulated_returnsCorrespondingResourceMap(
            ExchangeJsonContext context) throws IOException {
        Mono<? extends ArtifactExchangeJson> artifactJsonMono = createArtifactJson(context);

        Mono<? extends ArtifactExchangeJson> artifactJsonCloneMono = createArtifactJson(context);

        Mono<? extends Tuple2<GitResourceMap, ? extends ArtifactExchangeJson>> gitResourceMapAndArtifactJsonMono =
                artifactJsonMono
                        .map(artifactJson -> commonGitFileUtils.createGitResourceMap(artifactJson))
                        .zipWith(artifactJsonCloneMono);

        StepVerifier.create(gitResourceMapAndArtifactJsonMono)
                .assertNext(tuple2 -> {
                    GitResourceMap gitResourceMap = tuple2.getT1();
                    ArtifactExchangeJson exchangeJson = tuple2.getT2();

                    assertThat(gitResourceMap).isNotNull();

                    if (exchangeJson.getModifiedResources() == null) {
                        assertThat(gitResourceMap.getModifiedResources()).isNull();
                    } else {
                        assertThat(exchangeJson.getModifiedResources())
                                .isEqualTo(gitResourceMap.getModifiedResources());
                    }
                    Map<GitResourceIdentity, Object> resourceMap = gitResourceMap.getGitResourceMap();
                    assertThat(resourceMap).isNotNull();

                    assertThat(resourceMap).hasSize(context.resourceMapKeyCount());

                    long count = templateProvider.assertResourceComparisons(exchangeJson, resourceMap);

                    assertThat(count).isEqualTo(context.resourceMapKeyCount());
                })
                .verifyComplete();
    }

    private Mono<? extends ArtifactExchangeJson> createArtifactJson(ExchangeJsonContext context) throws IOException {

        String filePath = "test_assets/ImportExportServiceTest/" + context.getFileName();

        ClassPathResource classPathResource = new ClassPathResource(filePath);

        String artifactJson = classPathResource.getContentAsString(Charset.defaultCharset());

        Class<? extends ArtifactExchangeJson> exchangeJsonType = context.getArtifactExchangeJsonType();

        ArtifactExchangeJson artifactExchangeJson =
                objectMapper.copy().disable(MapperFeature.USE_ANNOTATIONS).readValue(artifactJson, exchangeJsonType);

        return jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(artifactExchangeJson, null, null, null);
    }

    @TestTemplate
    public void testConvertGitResourceMapToArtifactExchangeJson_whenArtifactIsFullyPopulated_returnsCorrespondingJson(
            ExchangeJsonContext context) throws IOException {
        ArtifactExchangeJson originalArtifactJson = createArtifactJson(context).block();

        GitResourceMap gitResourceMap = commonGitFileUtils.createGitResourceMap(originalArtifactJson);

        ArtifactExchangeJson artifactExchangeJson =
                commonGitFileUtils.createArtifactExchangeJson(gitResourceMap, ArtifactType.APPLICATION);

        assertThat(artifactExchangeJson).isNotNull();

        templateProvider.assertResourceComparisons(originalArtifactJson, artifactExchangeJson);
    }
}
