package com.external.plugins;


import com.external.plugins.exceptions.OraclePluginError;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Arrays;
import java.util.stream.Collectors;

@Slf4j
@Testcontainers
public class OraclePluginTest {
    @Test
    public void verifyUniquenessOfOraclePluginErrorCode() {
        assert (Arrays.stream(OraclePluginError.values()).map(OraclePluginError::getAppErrorCode).distinct().count() == OraclePluginError.values().length);

        assert (Arrays.stream(OraclePluginError.values()).map(OraclePluginError::getAppErrorCode)
                .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-ORC"))
                .collect(Collectors.toList()).size() == 0);

    }
}
