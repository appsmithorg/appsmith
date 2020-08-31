package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Set;

public class  ElasticSearchPlugin extends BasePlugin {

    public ElasticSearchPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class ElasticSearchPluginExecutor implements PluginExecutor{

        public void esTest(String elasticSearchUrl){
            final String HTTP = "http://";
            WebClient wb = WebClient.builder()
                    .baseUrl(HTTP + elasticSearchUrl)
                    .defaultHeader(
                            HttpHeaders.CONTENT_TYPE,
                            MediaType.APPLICATION_JSON_VALUE)
                    .build();
            String res = wb.get().uri("/_cluster/health").retrieve().bodyToMono(String.class).block();
            System.out.println("-=-=-=-=-=-=-=-=--=-=   response -=-=-=-=-=-=-=-=-=-=-=-=");
            System.out.println(res);
            System.out.println("-=-=-=-=-=-=-=-=--=-=   response -=-=-=-=-=-=-=-=-=-=-=-=");
        }

        @Override
        public Mono<ActionExecutionResult> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return null;
        }

        @Override
        public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public void datasourceDestroy(Object connection) {

        }

        @Override
        public boolean isDatasourceValid(DatasourceConfiguration datasourceConfiguration) {
            return false;
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }
    }
}
