package com.appsmith.util;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.spec.RSAPrivateCrtKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

public class CryptoUtil {
    public static RSAPublicKeySpec decodeOpenSSH(byte[] input) {
        String[] fields = new String(input, StandardCharsets.US_ASCII).split(" ");
        if ((fields.length < 2) || (!fields[0].equals("ssh-rsa")))
            throw new IllegalArgumentException("Unsupported type");
        byte[] std = Base64.getDecoder().decode(fields[1]);
        return decodeRSAPublicSSH(std);
    }

    static RSAPublicKeySpec decodeRSAPublicSSH(byte[] encoded) {
        ByteBuffer input = ByteBuffer.wrap(encoded);
        String type = string(input);
        if (!"ssh-rsa".equals(type)) throw new IllegalArgumentException("Unsupported type");
        BigInteger exp = sshint(input);
        BigInteger mod = sshint(input);
        if (input.hasRemaining()) throw new IllegalArgumentException("Excess data");
        return new RSAPublicKeySpec(mod, exp);
    }

    static RSAPrivateCrtKeySpec decodeRSAPrivatePKCS1(byte[] encoded) {
        ByteBuffer input = ByteBuffer.wrap(encoded);
        if (der(input, 0x30) != input.remaining()) throw new IllegalArgumentException("Excess data");
        if (!BigInteger.ZERO.equals(derint(input))) throw new IllegalArgumentException("Unsupported version");
        BigInteger n = derint(input);
        BigInteger e = derint(input);
        BigInteger d = derint(input);
        BigInteger p = derint(input);
        BigInteger q = derint(input);
        BigInteger ep = derint(input);
        BigInteger eq = derint(input);
        BigInteger c = derint(input);
        return new RSAPrivateCrtKeySpec(n, e, d, p, q, ep, eq, c);
    }

    private static String string(ByteBuffer buf) {
        return new String(lenval(buf), Charset.forName("US-ASCII"));
    }

    private static BigInteger sshint(ByteBuffer buf) {
        return new BigInteger(+1, lenval(buf));
    }

    private static byte[] lenval(ByteBuffer buf) {
        byte[] copy = new byte[buf.getInt()];
        buf.get(copy);
        return copy;
    }

    private static BigInteger derint(ByteBuffer input) {
        int len = der(input, 0x02);
        byte[] value = new byte[len];
        input.get(value);
        return new BigInteger(+1, value);
    }

    private static int der(ByteBuffer input, int exp) {
        int tag = input.get() & 0xFF;
        if (tag != exp) throw new IllegalArgumentException("Unexpected tag");
        int n = input.get() & 0xFF;
        if (n < 128) return n;
        n &= 0x7F;
        if ((n < 1) || (n > 2)) throw new IllegalArgumentException("Invalid length");
        int len = 0;
        while (n-- > 0) {
            len <<= 8;
            len |= input.get() & 0xFF;
        }
        return len;
    }

    private static byte[] readAllBase64Bytes(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        BufferedReader r = new BufferedReader(new InputStreamReader(input, StandardCharsets.US_ASCII));
        Base64.Decoder decoder = Base64.getDecoder();
        while (true) {
            String line = r.readLine();
            if (line == null) break;
            if (line.startsWith("-----")) continue;
            output.write(decoder.decode(line));
        }
        return output.toByteArray();
    }
}
