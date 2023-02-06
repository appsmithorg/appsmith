package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class HmacHashUtilsTest {

    @Test
    public void givenDataAndKeyAndAlgorithm_whenHmacWithJava_thenSuccess()
        throws NoSuchAlgorithmException, InvalidKeyException {

        String hmacSHA256Value = "953D7D721FE4FDDA63E519696A726A1FE84B32215305A9906FB226367C1D2705";
        String hmacSHA256Algorithm = "HmacSHA256";
        String data = "appsmith";
        String key = "123456";

        String result = HmacHashUtils.createHash(hmacSHA256Algorithm, data, key);

        assertEquals(hmacSHA256Value, result);
    }
}
