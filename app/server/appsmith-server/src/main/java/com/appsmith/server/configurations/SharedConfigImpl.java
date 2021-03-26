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

    @Override
    public int getCodecSize() {
        return this.CODEC_SIZE * 1024 * 1024;
    }
}
