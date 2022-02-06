package com.appsmith.server.configurations;

import com.appsmith.external.services.SharedConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class SharedConfigImpl implements SharedConfig {

    @Value("${appsmith.codec.max-in-memory-size:10}")
    private int CODEC_SIZE;

    @Value("${appsmith.plugin.response.size.max:5}")
    private float maxPluginResponseSize = 5;

    @Value("${appsmith.cloud_services.base_url}")
    private String cloudServicesBaseUrl;

    @Override
    public int getCodecSize() {
        return this.CODEC_SIZE * 1024 * 1024;
    }

    @Override
    public int getMaxResponseSize() {
        return (int) (this.maxPluginResponseSize * 1024 * 1024);
    }

    @Override
    public String getRemoteExecutionUrl() {
        return cloudServicesBaseUrl + "/api/v1/actions/execute";
    }
}
