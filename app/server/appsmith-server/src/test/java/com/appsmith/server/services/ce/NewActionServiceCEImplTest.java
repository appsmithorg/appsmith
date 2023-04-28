package com.appsmith.server.services.ce;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.dtos.ParamProperty;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.MarketplaceService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.codec.ByteBufferDecoder;
import org.springframework.core.codec.StringDecoder;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.DecoderHttpMessageReader;
import org.springframework.http.codec.FormHttpMessageReader;
import org.springframework.http.codec.HttpMessageReader;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.multipart.DefaultPartHttpMessageReader;
import org.springframework.http.codec.multipart.MultipartHttpMessageReader;
import org.springframework.http.codec.multipart.Part;
import org.springframework.http.codec.xml.Jaxb2XmlDecoder;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.reactive.function.BodyExtractor;
import org.springframework.web.reactive.function.BodyExtractors;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.test.StepVerifier;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;


@ExtendWith(SpringExtension.class)
@Slf4j
public class NewActionServiceCEImplTest {

    NewActionServiceCEImpl newActionService;

    @MockBean
    Scheduler scheduler;
    @MockBean
    Validator validator;
    @MockBean
    MongoConverter mongoConverter;
    @MockBean
    ReactiveMongoTemplate reactiveMongoTemplate;
    @MockBean
    AnalyticsService analyticsService;
    @MockBean
    DatasourceService datasourceService;
    @MockBean
    PluginService pluginService;
    @MockBean
    DatasourceContextService datasourceContextService;
    @MockBean
    PluginExecutorHelper pluginExecutorHelper;
    @MockBean
    MarketplaceService marketplaceService;
    @MockBean
    PolicyGenerator policyGenerator;
    @MockBean
    NewPageService newPageService;
    @MockBean
    ApplicationService applicationService;
    @MockBean
    SessionUserService sessionUserService;
    @MockBean
    PolicyUtils policyUtils;
    @MockBean
    AuthenticationValidator authenticationValidator;
    @MockBean
    ConfigService configService;
    @MockBean
    ResponseUtils responseUtils;

    @MockBean
    PermissionGroupService permissionGroupService;

    @MockBean
    NewActionRepository newActionRepository;

    @MockBean
    DatasourcePermission datasourcePermission;
    @MockBean
    ApplicationPermission applicationPermission;
    @MockBean
    PagePermission pagePermission;
    @MockBean
    ActionPermission actionPermission;
    @MockBean
    ObservationRegistry observationRegistry;

    private BodyExtractor.Context context;

    private Map<String, Object> hints;

    @BeforeEach
    public void setup() {
        newActionService = new NewActionServiceCEImpl(scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                newActionRepository,
                analyticsService,
                datasourceService,
                pluginService,
                datasourceContextService,
                pluginExecutorHelper,
                marketplaceService,
                policyGenerator,
                newPageService,
                applicationService,
                sessionUserService,
                policyUtils,
                authenticationValidator,
                configService,
                responseUtils,
                permissionGroupService,
                datasourcePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                observationRegistry);

        ObservationRegistry.ObservationConfig mockObservationConfig = Mockito.mock(ObservationRegistry.ObservationConfig.class);
        Mockito.when(observationRegistry.observationConfig()).thenReturn(mockObservationConfig);
    }

    @BeforeEach
    public void createContext() {
        final List<HttpMessageReader<?>> messageReaders = new ArrayList<>();
        messageReaders.add(new DecoderHttpMessageReader<>(new ByteBufferDecoder()));
        messageReaders.add(new DecoderHttpMessageReader<>(StringDecoder.allMimeTypes()));
        messageReaders.add(new DecoderHttpMessageReader<>(new Jaxb2XmlDecoder()));
        messageReaders.add(new DecoderHttpMessageReader<>(new Jackson2JsonDecoder()));
        messageReaders.add(new FormHttpMessageReader());
        DefaultPartHttpMessageReader partReader = new DefaultPartHttpMessageReader();
        messageReaders.add(partReader);
        messageReaders.add(new MultipartHttpMessageReader(partReader));

        this.context = new BodyExtractor.Context() {
            @Override
            public List<HttpMessageReader<?>> messageReaders() {
                return messageReaders;
            }

            @Override
            public Optional<ServerHttpResponse> serverResponse() {
                return Optional.empty();
            }

            @Override
            public Map<String, Object> hints() {
                return hints;
            }
        };
        this.hints = new HashMap<>();
    }

    @Test
    public void testExecuteAction_withoutExecuteActionDTOPart_failsValidation() {
        final Mono<ActionExecutionResult> actionExecutionResultMono = newActionService.executeAction(Flux.empty(), null, null);

        StepVerifier
                .create(actionExecutionResultMono)
                .expectErrorMatches(e -> e instanceof AppsmithException &&
                        e.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ACTION_ID)))
                .verify();
    }

    @Test
    public void testExecuteAction_withMalformedExecuteActionDTO_failsValidation() {
        MockServerHttpRequest mock = MockServerHttpRequest
                .method(HttpMethod.POST, URI.create("https://example.com"))
                .contentType(new MediaType("multipart", "form-data", Map.of("boundary", "boundary")))
                .body("""
                        --boundary\r
                        Content-Disposition: form-data; name="executeActionDTO"\r
                        \r
                        irrelevant content\r
                        --boundary--\r
                        """);

        final Flux<Part> partsFlux = BodyExtractors.toParts()
                .extract(mock, this.context);

        final Mono<ActionExecutionResult> actionExecutionResultMono = newActionService.executeAction(partsFlux, null, null);

        StepVerifier
                .create(actionExecutionResultMono)
                .expectErrorMatches(e -> e instanceof AppsmithException &&
                        e.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage("executeActionDTO")))
                .verify();
    }

    @Test
    public void testExecuteAction_withoutActionId_failsValidation() {
        MockServerHttpRequest mock = MockServerHttpRequest
                .method(HttpMethod.POST, URI.create("https://example.com"))
                .contentType(new MediaType("multipart", "form-data", Map.of("boundary", "boundary")))
                .body("""
                        --boundary\r
                        Content-Disposition: form-data; name="executeActionDTO"\r
                        \r
                        {"viewMode":false}\r
                        --boundary--\r
                        """);

        final Flux<Part> partsFlux = BodyExtractors.toParts()
                .extract(mock, this.context);

        final Mono<ActionExecutionResult> actionExecutionResultMono = newActionService.executeAction(partsFlux, null, null);

        StepVerifier
                .create(actionExecutionResultMono)
                .expectErrorMatches(e -> e instanceof AppsmithException &&
                        e.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ACTION_ID)))
                .verify();
    }

    @Test
    public void testMissingPluginIdAndTypeFixForNonJSPluginType() {
        /* Mock `findById` method of pluginService to return `testPlugin` */
        Plugin testPlugin = new Plugin();
        testPlugin.setId("testId");
        testPlugin.setType(PluginType.DB);
        Mockito.when(pluginService.findById(anyString()))
                .thenReturn(Mono.just(testPlugin));

        NewAction action = new NewAction();
        action.setPluginId(null);
        action.setPluginType(null);
        ActionDTO actionDTO = new ActionDTO();
        Datasource datasource = new Datasource();
        /* Datasource has correct plugin id */
        datasource.setPluginId(testPlugin.getId());
        actionDTO.setDatasource(datasource);
        action.setUnpublishedAction(actionDTO);

        Mono<NewAction> updatedActionFlux = newActionService.sanitizeAction(action);
        StepVerifier.create(updatedActionFlux)
                .assertNext(updatedAction -> {
                    assertEquals("testId", updatedAction.getPluginId());
                    assertEquals(PluginType.DB, updatedAction.getPluginType());
                })
                .verifyComplete();
    }

    @Test
    public void testMissingPluginIdAndTypeFixForJSPluginType() {
        /* Mock `findByPackageName` method of pluginService to return `testPlugin` */
        Plugin testPlugin = new Plugin();
        testPlugin.setId("testId");
        testPlugin.setType(PluginType.JS);
        Mockito.when(pluginService.findByPackageName(anyString()))
                .thenReturn(Mono.just(testPlugin));

        NewAction action = new NewAction();
        action.setPluginId(null);
        action.setPluginType(null);
        ActionDTO actionDTO = new ActionDTO();
        /* Non-null collection id to indicate a JS action */
        actionDTO.setCollectionId("testId");
        action.setUnpublishedAction(actionDTO);

        Mono<NewAction> updatedActionFlux = newActionService.sanitizeAction(action);
        StepVerifier.create(updatedActionFlux)
                .assertNext(updatedAction -> {
                    assertEquals("testId", updatedAction.getPluginId());
                    assertEquals(PluginType.JS, updatedAction.getPluginType());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteAPIWithUsualOrderingOfTheParts() {
        String usualOrderOfParts = """
                --boundary\r
                Content-Disposition: form-data; name="executeActionDTO"\r
                \r
                {"actionId":"63285a3388e48972c7519b18","viewMode":false,"paramProperties":{"k0":{"datatype": "string"}}}\r
                --boundary\r
                Content-Disposition: form-data; name="parameterMap"\r
                \r
                {"Input1.text":"k0"}\r
                --boundary\r
                Content-Disposition: form-data; name="k0"; filename="blob"\r
                Content-Type: text/plain\r
                \r
                xyz\r
                --boundary--""";

        MockServerHttpRequest mock = MockServerHttpRequest
                .method(HttpMethod.POST, URI.create("https://example.com"))
                .contentType(new MediaType("multipart", "form-data", Map.of("boundary", "boundary")))
                .body(usualOrderOfParts);

        final Flux<Part> partsFlux = BodyExtractors.toParts()
                .extract(mock, this.context);

        NewActionServiceCE newActionServiceSpy = spy(newActionService);

        Mono<ActionExecutionResult> actionExecutionResultMono = newActionServiceSpy.executeAction(partsFlux, null, null);

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("test body");
        mockResult.setTitle("test title");

        NewAction newAction = new NewAction();
        newAction.setId("63285a3388e48972c7519b18");
        doReturn(Mono.just(mockResult)).when(newActionServiceSpy).executeAction(any(), any());
        doReturn(Mono.just(newAction)).when(newActionServiceSpy).findByBranchNameAndDefaultActionId(any(), any(), any());


        StepVerifier
                .create(actionExecutionResultMono)
                .assertNext(response -> {
                    assertNotNull(response);
                    assertTrue(response.getIsExecutionSuccess());
                    assertEquals(mockResult.getBody().toString(), response.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteAPIWithParameterMapAsLastPart() {
        String parameterMapAtLast = """
                --boundary\r
                Content-Disposition: form-data; name="executeActionDTO"\r
                \r
                {"actionId":"63285a3388e48972c7519b18","viewMode":false,"paramProperties":{"k0":{"datatype": "string"}}}\r
                --boundary\r
                Content-Disposition: form-data; name="k0"; filename="blob"\r
                Content-Type: text/plain\r
                \r
                xyz\r
                --boundary\r
                Content-Disposition: form-data; name="parameterMap"\r
                \r
                {"Input1.text":"k0"}\r
                --boundary--""";

        MockServerHttpRequest mock = MockServerHttpRequest
                .method(HttpMethod.POST, URI.create("https://example.com"))
                .contentType(new MediaType("multipart", "form-data", Map.of("boundary", "boundary")))
                .body(parameterMapAtLast);

        final Flux<Part> partsFlux = BodyExtractors.toParts()
                .extract(mock, this.context);

        NewActionServiceCE newActionServiceSpy = spy(newActionService);

        Mono<ActionExecutionResult> actionExecutionResultMono = newActionServiceSpy.executeAction(partsFlux, null, null);

        ActionExecutionResult mockResult = new ActionExecutionResult();
        mockResult.setIsExecutionSuccess(true);
        mockResult.setBody("test body");
        mockResult.setTitle("test title");

        NewAction newAction = new NewAction();
        newAction.setId("63285a3388e48972c7519b18");
        doReturn(Mono.just(mockResult)).when(newActionServiceSpy).executeAction(any(), any());
        doReturn(Mono.just(newAction)).when(newActionServiceSpy).findByBranchNameAndDefaultActionId(any(), any(), any());


        StepVerifier
                .create(actionExecutionResultMono)
                .assertNext(response -> {
                    assertNotNull(response);
                    assertTrue(response.getIsExecutionSuccess());
                    assertEquals(mockResult.getBody().toString(), response.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testParsePartsAndGetParamsFlux_withBlobIdentifiers_replacesValueInParam() {
        String partsWithBlobRefs = """
                --boundary\r
                Content-Disposition: form-data; name="executeActionDTO"\r
                \r
                {"actionId":"63285a3388e48972c7519b18","viewMode":false,"paramProperties":{"k0":{"datatype": "string", "blobIdentifiers": ["blob:12345678-1234-1234-1234-123456781234"]}}}\r
                --boundary\r
                Content-Disposition: form-data; name="parameterMap"\r
                \r
                {"Input1.text":"k0"}\r
                --boundary\r
                Content-Disposition: form-data; name="k0"; filename="blob"\r
                Content-Type: text/plain\r
                \r
                {"name": "randomName", "data": "blob:12345678-1234-1234-1234-123456781234"}\r
                --boundary\r
                Content-Disposition: form-data; name="blob:12345678-1234-1234-1234-123456781234"; filename="blob"\r
                Content-Type: text/plain\r
                \r
                xy\\nz\r
                --boundary--""";

        MockServerHttpRequest mock = MockServerHttpRequest
                .method(HttpMethod.POST, URI.create("https://example.com"))
                .contentType(new MediaType("multipart", "form-data", Map.of("boundary", "boundary")))
                .body(partsWithBlobRefs);

        final Flux<Part> partsFlux = BodyExtractors.toParts()
                .extract(mock, this.context);

        AtomicLong atomicLong = new AtomicLong();
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        Mono<List<Param>> paramsListMono = newActionService.parsePartsAndGetParamsFlux(partsFlux, atomicLong, executeActionDTO).collectList().cache();

        StepVerifier.create(paramsListMono)
                .assertNext(paramsList -> {
                    assertEquals(1, paramsList.size());
                    Param param = paramsList.get(0);
                    assertEquals("{\"name\": \"randomName\", \"data\": \"blob:12345678-1234-1234-1234-123456781234\"}", param.getValue());
                })
                .verifyComplete();
    }

    @Test
    public void testEnrichExecutionParams_withBlobReference_performsSubstitutionCorrectly() {
        AtomicLong atomicLong = new AtomicLong(45L);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setActionId("testId");
        executeActionDTO.setViewMode(false);
        executeActionDTO.setParamProperties(Map.of("k0", new ParamProperty("string", List.of("blobId"))));
        executeActionDTO.setParameterMap(Map.of("Input1.text", "k0"));
        executeActionDTO.setBlobValuesMap(Map.of("blobId", "xy\\nz"));
        Param param1 = new Param();
        param1.setValue("{\"name\": \"randomName\", \"data\": \"blobId\"}");
        param1.setPseudoBindingName("k0");
        List<Param> params = List.of(param1);

        Mono<ExecuteActionDTO> enrichedDto = newActionService.enrichExecutionParam(atomicLong, executeActionDTO, params);

        StepVerifier.create(enrichedDto)
                .assertNext(dto -> {
                    assertEquals(45, dto.getTotalReadableByteCount());

                    Param param = dto.getParams().get(0);
                    assertEquals(ClientDataType.STRING, param.getClientDataType());
                    assertEquals("{\"name\": \"randomName\", \"data\": \"xy\\\\nz\"}", param.getValue());
                })
                .verifyComplete();
    }
}