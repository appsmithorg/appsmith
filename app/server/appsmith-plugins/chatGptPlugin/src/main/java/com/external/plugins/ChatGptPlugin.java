package com.appsmith.plugins;

import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.BaseRestApiPluginExecutor;
import com.appsmith.external.services.SharedConfig;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;

public class ChatGptPlugin extends BasePlugin {

    public ChatGptPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    public static class ChatGptPluginExecutor extends BaseRestApiPluginExecutor {

        private static ChatGptPluginExecutor instance;

        public ChatGptPluginExecutor(SharedConfig config) {
            super(config);
        }

        public static ChatGptPluginExecutor getInstance(SharedConfig sharedConfig) {
            if(instance == null) {
                instance = new ChatGptPluginExecutor(sharedConfig);
            }
            return instance;
        }

        @Override
        public Mono<ActionExecutionResult> execute(APIConnection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {

            // Get prompt from action configuration
            String prompt = actionConfiguration.getPrompt();

            // Make API call to ChatGPT
            String response = makeApiCall(prompt, datasourceConfiguration.getApiKey());

            // Build execution result
            ActionExecutionResult result = new ActionExecutionResult();
            result.setBody(response);

            return Mono.just(result);

        }

        private String makeApiCall(String prompt, String apiKey) {
            // Call ChatGPT API using apiKey and prompt
            // Return response
            String response = "";
            return response;
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return super.validateDatasource(datasourceConfiguration);
        }

        // Other methods implemented by calling super class

    }

}
