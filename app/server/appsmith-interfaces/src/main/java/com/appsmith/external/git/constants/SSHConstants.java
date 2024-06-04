package com.appsmith.external.git.constants;

public class SSHConstants {
    public static final String RSA_TYPE = "ssh-rsa";
    public static final String RSA_TYPE_PREFIX = RSA_TYPE + " ";
    private static final String ECDSA_TYPE = "ecdsa-sha2-nistp256";
    public static final String ECDSA_TYPE_PREFIX = ECDSA_TYPE + " ";

    public static final String RSA_KEY_FACTORY_IDENTIFIER = "RSA";
    public static final String ECDSA_KEY_FACTORY_IDENTIFIER = "EC";
    public static final String ECDSA_KEY_FACTORY_IDENTIFIER_BC = "ECDSA";
}
