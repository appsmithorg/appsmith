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
                pluginExecutorHelper,
                marketplaceService,
                policyGenerator,
                newPageService,
                applicationService,
                policyUtils,
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

}