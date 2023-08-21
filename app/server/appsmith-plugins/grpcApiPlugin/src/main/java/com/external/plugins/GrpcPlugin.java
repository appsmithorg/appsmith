package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnectionFactory;
import com.appsmith.external.helpers.restApiUtils.connections.OAuth2AuthorizationCode;
import com.appsmith.external.models.*;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.SharedConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.google.protobuf.DescriptorProtos;
import io.grpc.stub.MetadataUtils;
import kotlin.Metadata;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.pf4j.spring.SpringPluginManager;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static io.grpc.Metadata.ASCII_STRING_MARSHALLER;

public class GrpcPlugin extends BasePlugin {

    static final String BEARER_TYPE = "Bearer";
    static final Metadata.Key<String> AUTHORIZATION_METADATA_KEY = Metadata.Key.of("Authorization", ASCII_STRING_MARSHALLER);
    private static Map<String, GrpcService> serviceMap;
    private static List<String> serviceNames;

    public GrpcPlugin(PluginWrapper wrapper) {
        super(wrapper);
        SharedConfig config = ((SpringPluginManager) wrapper.getPluginManager()).getApplicationContext().getBean(SharedConfig.class);
        InputStream inputStream = this.getWrapper().getPluginClassLoader().getResourceAsStream("carbon-protos.desc");
        assert inputStream != null;
        loadDescriptor(inputStream, this, config.getGrpcTargetMapping());
    }

    private void loadDescriptor(InputStream inputStream, GrpcPlugin grpcPlugin, Map<String, String> grpcTargetMapping) {
        try {
            byte[] data = inputStream.readAllBytes();
            DescriptorProtos.FileDescriptorSet protoSet = DescriptorProtos.FileDescriptorSet.parseFrom(data);
            Map<String, DescriptorProtos.FileDescriptorProto> allProtoMap = protoSet
                    .getFileList()
                    .stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(DescriptorProtos.FileDescriptorProto::getName, f -> f));

            List<GrpcService> services = allProtoMap.values().stream()
                    .filter(f -> f.getName().startsWith("internal/"))
                    .filter(f -> f.getServiceCount() > 0)
                    .flatMap(f -> f.getServiceList().stream().map(s -> GrpcService.buildFrom(f, s, allProtoMap, grpcTargetMapping)))
                    .collect(Collectors.toList());

            Map<String, GrpcService> serviceMap = services.stream()
                    .collect(
                            HashMap::new,
                            (m, service) -> {
                                service.getServiceMethodFullNames().forEach(key -> m.put(key, service));
                            },
                            HashMap::putAll
                    );
            List<String> serviceNames = services.stream()
                    .flatMap(s -> s.getServiceMethodFullNames().stream())
                    .collect(Collectors.toList());
            grpcPlugin.serviceMap = serviceMap;
            grpcPlugin.serviceNames = serviceNames;
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Slf4j
    @Extension
    public static class GrpcPluginExecutor implements PluginExecutor<APIConnection>, SmartSubstitutionInterface {
        private final Scheduler scheduler = Schedulers.boundedElastic();
        private Channel channelToUse;


        @Override
        public Mono<ActionExecutionResult> execute(APIConnection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            if (actionConfiguration.getBody() != null) {
                String updatedBody = actionConfiguration.getBody();

                try {
                    JSONParser parser = new JSONParser();
                    JSONObject json = (JSONObject) parser.parse(actionConfiguration.getBody());
                    updatedBody = json.toJSONString();
                } catch (ParseException e) {
                    ActionExecutionResult errorResult = new ActionExecutionResult();
                    errorResult.setIsExecutionSuccess(false);
                    errorResult.setErrorInfo(e);
                    errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                    return Mono.just(errorResult);
                }

                actionConfiguration.setBody(updatedBody);

                return this.executeWithBlockingCalls(connection, datasourceConfiguration, actionConfiguration)
                        .subscribeOn(scheduler);
            }
            return Mono.empty();
        }

        public ActionExecutionResult executeWithBlockingCalls(APIConnection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            Map<String, Object> formData = actionConfiguration.getFormData();
            String methodName = PluginUtils.getValueSafelyFromFormDataAsString(formData, "methodName");
            GrpcService service = serviceMap.get(methodName);

            if (service == null) {
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                errorResult.setIsExecutionSuccess(false);
                errorResult.setBody("Method name is not found!");
                return errorResult;
            }
            if (service.getTarget() == null) {
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                errorResult.setIsExecutionSuccess(false);
                errorResult.setBody("Service target is not set!");
                return errorResult;
            }

            ManagedChannel channel = ManagedChannelBuilder
                    .forTarget(service.getTarget().getUrl())
                    .useTransportSecurity()
                    .build();

            String requestBody = actionConfiguration.getBody();


            channelToUse = ClientInterceptors.intercept(channel, MetadataUtils.newAttachHeadersInterceptor(headers));
            List<String> jsonResponses = service.executeCall(channelToUse, methodName, requestBody);
            channel.shutdown();

            ActionExecutionResult result = new ActionExecutionResult();
            try {
                ArrayNode resultArray = objectMapper.createArrayNode();
                for (String jsonResponse : jsonResponses) {
                    JsonNode jsonNode = objectMapper.readTree(jsonResponse);
                    resultArray.add(jsonNode);
                }

                result.setStatusCode("200");
                result.setIsExecutionSuccess(true);
                result.setBody(resultArray);
            } catch (IOException e) {
                throw Exceptions.propagate(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                e.getMessage()
                        )
                );
            }

            try {
                channel.awaitTermination(200, TimeUnit.MILLISECONDS);
            } catch (InterruptedException ignored) {
            }

            return result;
        }

        @Override
        public Mono<APIConnection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return APIConnectionFactory.createConnection(datasourceConfiguration);
        }

        @Override
        public void datasourceDestroy(APIConnection connection) {
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Set.of();
        }

        @Override
        public Mono<TriggerResultDTO> trigger(APIConnection connection, DatasourceConfiguration
                datasourceConfiguration, TriggerRequestDTO request) {
            ArrayList<Map<String, String>> result = new ArrayList<>();
            for (String entityName : GrpcPlugin.serviceNames) {
                Map<String, String> entity = new HashMap<>();
                entity.put("label", entityName);
                entity.put("value", entityName);
                result.add(entity);
            }

            return Mono.just(new TriggerResultDTO(result));
        }
    }


}
