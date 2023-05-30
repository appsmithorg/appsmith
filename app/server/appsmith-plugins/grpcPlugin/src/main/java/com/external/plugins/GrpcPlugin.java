package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.*;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;

import com.external.config.DropdownOption;
import com.external.config.GrpcEndpoint;
import com.external.config.ReflectiveManagedChannel;
import com.google.protobuf.DynamicMessage;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.util.JsonFormat;
import io.grpc.CallOptions;
import lombok.extern.slf4j.Slf4j;

import org.pf4j.Extension;
import org.pf4j.PluginWrapper;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.*;
import java.util.concurrent.TimeUnit;

import static com.appsmith.external.helpers.PluginUtils.*;
import static com.external.config.ReflectiveManagedChannel.decorateChannel;

@Slf4j(topic = "GrpcPlugin")
public class GrpcPlugin extends BasePlugin {
    public GrpcPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class GrpcPluginExecutor implements PluginExecutor<ReflectiveManagedChannel>, SmartSubstitutionInterface {
        private static String FORM_DATA_BODY = "body";
        private static String FORM_DATA_SERVICE = "service";
        private static String FORM_DATA_ENDPOINT = "endpoint";
        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(
                ReflectiveManagedChannel connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration
        ) {
            log.debug("[GrpcPluginExecutor] execute {} {}", actionConfiguration);
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<ActionExecutionResult> executeParameterized(ReflectiveManagedChannel connection, ExecuteActionDTO executeActionDTO, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            log.debug("[GrpcPluginExecutor] executeParameterized {} {}", executeActionDTO, actionConfiguration);
            int callTimeout = actionConfiguration.getTimeoutInMillisecond();

            List<Map.Entry<String, String>> parameters = new ArrayList<>();
            try {
                String body = getDataValueSafelyFromFormData(actionConfiguration.getFormData(), FORM_DATA_BODY, STRING_TYPE, "");
                // Smartly substitute in Json fields and replace all the bindings with values.
                // First extract all the bindings in order
                List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(body);
                if(mustacheKeysInOrder.size() > 0) {
                    // Replace all the bindings with a placeholder
                    String updatedValue = MustacheHelper.replaceMustacheWithPlaceholder(body, mustacheKeysInOrder);

                    updatedValue = (String) smartSubstitutionOfBindings(updatedValue,
                            mustacheKeysInOrder,
                            executeActionDTO.getParams(),
                            parameters);

                    setDataValueSafelyInFormData(actionConfiguration.getFormData(), FORM_DATA_BODY, updatedValue);
                }
            } catch (AppsmithPluginException e) {
                // Initializing object for error condition
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                errorResult.setIsExecutionSuccess(false);
                errorResult.setErrorInfo(e);
                return Mono.just(errorResult);
            }
            String serviceName = getDataValueSafelyFromFormData(actionConfiguration.getFormData(), FORM_DATA_SERVICE, STRING_TYPE, "");
            String endpointName = getDataValueSafelyFromFormData(actionConfiguration.getFormData(), FORM_DATA_ENDPOINT, STRING_TYPE, "");
            String body = getDataValueSafelyFromFormData(actionConfiguration.getFormData(), FORM_DATA_BODY, STRING_TYPE, "");

            if (body == null || "".equals(body)) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Body cannot be empty"));
            }

            Optional<GrpcEndpoint> first = connection.getGrpcServices().stream().filter((end) -> end.getMethod().getService().getFullName().equals(serviceName) && end.getMethod().getName().equals(endpointName)).findFirst();
            if (first.isEmpty()) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Cannot find endpoint"));
            }
            GrpcEndpoint grpcEndpoint = first.get();
            DynamicMessage.Builder requestBuilder = DynamicMessage.getDefaultInstance(grpcEndpoint.getMethod().getInputType()).newBuilderForType();
            try {
                JsonFormat.parser().merge(body, requestBuilder);
            } catch (InvalidProtocolBufferException e) {
                log.error(body);
                log.error(grpcEndpoint.getMethod().getInputType().getFields().get(0).getMessageType().getFullName());
                log.error("Cannot Parse Input", e);
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, e.getMessage()));
            }
            return grpcEndpoint.call(
                        decorateChannel(connection, actionConfiguration.getHeaders()),
                        requestBuilder.build(),
                        CallOptions.DEFAULT.withDeadlineAfter(callTimeout, TimeUnit.MILLISECONDS),
                        objectMapper
                    )
                    .subscribeOn(scheduler);
        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) {
            String jsonBody = (String) input;
            Param param = (Param) args[0];
            return DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue(jsonBody, value, null, insertedParams, null, param);
        }

        @Override
        public Mono<TriggerResultDTO> trigger(ReflectiveManagedChannel connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
            log.info("[GrpcPluginExecutor] trigger {}", request);
            final TriggerResultDTO triggerResultDTO = new TriggerResultDTO();
            return Mono.fromCallable(() -> {
                switch (request.getRequestType()) {
                    case "SERVICE_SELECTOR":
                        Set<String> serviceList = connection.getServices();
                        List<DropdownOption> services = new ArrayList<>();
                        for(String service : serviceList) {
                            services.add(new DropdownOption(service, service));
                        }
                        triggerResultDTO.setTrigger(services);
                        return triggerResultDTO;
                    case "ENDPOINT_SELECTOR":
                        Set<String> endpointList = connection.getEndpoints((String)request.getParameters().get("service"));
                        List<DropdownOption> endpoints = new ArrayList<>();
                        for(String endpoint : endpointList) {
                            endpoints.add(new DropdownOption(endpoint, endpoint));
                        }
                        triggerResultDTO.setTrigger(endpoints);
                        return triggerResultDTO;
                    case "TEMPLATE_SELECTOR":
                        triggerResultDTO.setTrigger("{}");
                        return triggerResultDTO;
                    default:
                        return null;
                }
            }).subscribeOn(scheduler);
        }

        @Override
        public Mono<ReflectiveManagedChannel> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return channelBuilder(datasourceConfiguration).subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(ReflectiveManagedChannel connection) {
            connection.shutdown();
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (datasourceConfiguration == null || datasourceConfiguration.getUrl() == null || datasourceConfiguration.getUrl().equals("")) {
                invalids.add("Url is needed.");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return channelBuilder(datasourceConfiguration).map(chanel -> {
                if(chanel.getServices().size() == 0) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Grpc Server doesn't have any services listed on the reflection response"
                    );
                }
                return new DatasourceTestResult();
            }).subscribeOn(scheduler);
        }

        private Mono<ReflectiveManagedChannel> channelBuilder(DatasourceConfiguration datasourceConfiguration) {
            log.info("Channel Builder {}", datasourceConfiguration.getProperties());

            return Mono.fromCallable(() -> new ReflectiveManagedChannel(datasourceConfiguration));
        }
    }

}