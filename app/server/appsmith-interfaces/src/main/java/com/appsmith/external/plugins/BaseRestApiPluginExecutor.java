package com.appsmith.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnectionFactory;
import com.appsmith.external.helpers.restApiUtils.helpers.DataUtils;
import com.appsmith.external.helpers.restApiUtils.helpers.DatasourceUtils;
import com.appsmith.external.helpers.restApiUtils.helpers.HintMessageUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.services.SharedConfig;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Set;

@Slf4j
@Extension
public class BaseRestApiPluginExecutor implements PluginExecutor<APIConnection>, SmartSubstitutionInterface {

    final SharedConfig sharedConfig;
    final DataUtils dataUtils;

    // Setting max content length. This would've been coming from `spring.codec.max-in-memory-size` property if the
    // `WebClient` instance was loaded as an auto-wired bean.
    public ExchangeStrategies EXCHANGE_STRATEGIES;

    public BaseRestApiPluginExecutor(SharedConfig sharedConfig) {
        this.sharedConfig = sharedConfig;
        this.dataUtils = DataUtils.getInstance();
        this.EXCHANGE_STRATEGIES = ExchangeStrategies
                .builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(sharedConfig.getCodecSize()))
                .build();
    }

    @Override
    public Mono<APIConnection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
        return APIConnectionFactory.createConnection(datasourceConfiguration.getAuthentication());
    }

    @Override
    public void datasourceDestroy(APIConnection connection) {
        // REST API plugin doesn't have a datasource.
    }

    @Override
    public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
        /* Use the default validation routine for REST API based plugins */
        return DatasourceUtils.validateDatasource(datasourceConfiguration);
    }

    @Override
    public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
        // At this point, the URL can be invalid because of mustache template keys inside it. Hence, connecting to
        // and verifying the URL isn't feasible. Since validation happens just before testing, and since validation
        // checks if a URL is present, there's nothing left to do here, but return a successful response.
        return Mono.just(new DatasourceTestResult());
    }

    @Override
    public Mono<ActionExecutionResult> execute(APIConnection apiConnection,
                                               DatasourceConfiguration datasourceConfiguration,
                                               ActionConfiguration actionConfiguration) {
        // Unused function
        return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
    }

    @Override
    public Mono<Tuple2<Set<String>, Set<String>>> getHintMessages(ActionConfiguration actionConfiguration,
                                                                  DatasourceConfiguration datasourceConfiguration) {
        /* Use the default hint message flow for REST API based plugins */
        return HintMessageUtils.getHintMessages(actionConfiguration, datasourceConfiguration);
    }
}
