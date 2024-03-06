package com.appsmith.server.helpers;

public class PackageUtils {
    // For now let's just consider every version as a patch version. Once we have product vision for this we'll engineer
    // the actual numbers.
    private static final int UPPER_LIMIT_PATCH_VERSION = Integer.MAX_VALUE;
    private static final int UPPER_LIMIT_MINOR_VERSION = Integer.MAX_VALUE;

    public static String getNextVersion(String version) {
        int[] ints = parseVersion(version);
        int major = ints[0], minor = ints[1], patch = ints[2];
        patch++;

        if (patch == UPPER_LIMIT_PATCH_VERSION) {
            patch = 0;
            minor++;
        }

        if (minor == UPPER_LIMIT_MINOR_VERSION) {
            minor = 0;
            major++;
        }

        return major + "." + minor + "." + patch;
    }

    public static int[] parseVersion(String version) {
        if (version == null) {
            return new int[] {0, 0, 0};
        }
        int[] versionNumbers = new int[3]; // Array to store major, minor, and patch

        String[] parts = version.split("\\.");
        if (parts.length == 3) {
            try {
                versionNumbers[0] = Integer.parseInt(parts[0]);
                versionNumbers[1] = Integer.parseInt(parts[1]);
                versionNumbers[2] = Integer.parseInt(parts[2]);
            } catch (NumberFormatException e) {
                // TODO: Handle parsing errors here
            }
        } else {
            // TODO: Handle invalid version string format here
        }

        return versionNumbers;
    }
}
