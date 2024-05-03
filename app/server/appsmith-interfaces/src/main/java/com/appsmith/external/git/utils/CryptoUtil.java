package com.appsmith.external.git.utils;

import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

import static com.appsmith.external.git.constants.SSHConstants.RSA_TYPE;

public class CryptoUtil {
    public static RSAPublicKeySpec decodeOpenSSHRSA(byte[] input) {
        String[] fields = new String(input, StandardCharsets.US_ASCII).split(" ");
        if ((fields.length < 2) || (!fields[0].equals(RSA_TYPE)))
            throw new IllegalArgumentException("Unsupported type");
        byte[] std = Base64.getDecoder().decode(fields[1]);
        return decodeRSAPublicSSH(std);
    }

    static RSAPublicKeySpec decodeRSAPublicSSH(byte[] encoded) {
        ByteBuffer input = ByteBuffer.wrap(encoded);
        String type = asString(input);
        if (!RSA_TYPE.equals(type)) throw new IllegalArgumentException("Unsupported type");
        BigInteger exp = sshInt(input);
        BigInteger mod = sshInt(input);
        return new RSAPublicKeySpec(mod, exp);
    }

    private static String asString(ByteBuffer buf) {
        return new String(lenVal(buf), StandardCharsets.US_ASCII);
    }

    private static BigInteger sshInt(ByteBuffer buf) {
        return new BigInteger(+1, lenVal(buf));
    }

    private static byte[] lenVal(ByteBuffer buf) {
        byte[] copy = new byte[buf.getInt()];
        buf.get(copy);
        return copy;
    }
}
