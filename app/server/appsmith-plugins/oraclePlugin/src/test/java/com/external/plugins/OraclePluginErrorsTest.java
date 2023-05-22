/* Copyright 2019-2023 Appsmith */
package com.external.plugins;

import com.external.plugins.exceptions.OraclePluginError;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

public class OraclePluginErrorsTest {

  @Test
  public void verifyUniquenessOfOraclePluginErrorCode() {
    assert (Arrays.stream(OraclePluginError.values())
            .map(OraclePluginError::getAppErrorCode)
            .distinct()
            .count()
        == OraclePluginError.values().length);

    assert (Arrays.stream(OraclePluginError.values())
            .map(OraclePluginError::getAppErrorCode)
            .filter(
                appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-ORC"))
            .collect(Collectors.toList())
            .size()
        == 0);
  }
}
