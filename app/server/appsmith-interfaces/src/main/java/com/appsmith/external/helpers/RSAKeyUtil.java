package com.appsmith.external.helpers;

import org.bouncycastle.asn1.ASN1InputStream;
import org.bouncycastle.asn1.pkcs.RSAPrivateKey;

import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Security;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPrivateKeySpec;
import java.util.Base64;

public class RSAKeyUtil {

    static {
        Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
    }

    private static final String PKCS_1_PEM_HEADER = "-----BEGIN RSA PRIVATE KEY-----";
    private static final String PKCS_1_PEM_FOOTER = "-----END RSA PRIVATE KEY-----";

    private static final String PKCS_8_PEM_HEADER = "-----BEGIN PRIVATE KEY-----";
    private static final String PKCS_8_PEM_FOOTER = "-----END PRIVATE KEY-----";

    public static boolean isPkcs1Key(String key) {
        return key.contains(PKCS_1_PEM_HEADER) && key.contains(PKCS_1_PEM_FOOTER);
    }

    public static String replaceHeaderAndFooterFromKey(String key) {
        return key.replace(PKCS_1_PEM_HEADER, "")
                .replace(PKCS_1_PEM_FOOTER, "")
                .replace(PKCS_8_PEM_HEADER, "")
                .replace(PKCS_8_PEM_FOOTER, "")
                .replace("\n", "");
    }

    public static PrivateKey readPkcs8PrivateKey(byte[] pkcs8Bytes) throws GeneralSecurityException {
        KeyFactory keyFactory = KeyFactory.getInstance("RSA", "SunRsaSign");
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(pkcs8Bytes);
        try {
            return keyFactory.generatePrivate(keySpec);
        } catch (InvalidKeySpecException e) {
            throw new IllegalArgumentException("Unexpected key format! Accepted key formats are pkcs8, pkcs1", e);
        }
    }

    public static PrivateKey readPkcs1PrivateKey(String base64EncodedPKCS1) throws Exception {
        // Decode the Base64-encoded PKCS#1 key
        byte[] pkcs1KeyBytes = Base64.getDecoder().decode(base64EncodedPKCS1);

        // Use Bouncy Castle's ASN1 classes to parse the ASN.1 structure of the PKCS#1 key
        ASN1InputStream asn1InputStream = new ASN1InputStream(pkcs1KeyBytes);
        RSAPrivateKey rsaPrivateKey = RSAPrivateKey.getInstance(asn1InputStream.readObject());
        asn1InputStream.close();

        // Convert ASN.1 structure to RSAPrivateKeySpec
        RSAPrivateKeySpec rsaPrivateKeySpec =
                new RSAPrivateKeySpec(rsaPrivateKey.getModulus(), rsaPrivateKey.getPrivateExponent());

        // Generate the PrivateKey object
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(rsaPrivateKeySpec);
    }
}
