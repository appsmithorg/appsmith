package com.appsmith.server.configurations;

import de.flapdoodle.embed.mongo.packageresolver.Command;
import de.flapdoodle.embed.mongo.packageresolver.PlatformPackageResolver;
import de.flapdoodle.embed.process.distribution.Distribution;
import de.flapdoodle.embed.process.distribution.Version;
import de.flapdoodle.os.CommonArchitecture;
import de.flapdoodle.os.CommonOS;
import de.flapdoodle.os.ImmutablePlatform;
import de.flapdoodle.os.Platform;
import de.flapdoodle.os.linux.LinuxDistribution;
import de.flapdoodle.os.linux.UbuntuVersion;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PropertiesLoaderUtils;

import java.io.IOException;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class EmbeddedMongoPackageTest {

    @ParameterizedTest
    @MethodSource("platforms")
    void configuredVersion_resolvesNativePackage(Platform platform, String archivePrefix) throws IOException {
        String version = PropertiesLoaderUtils.loadProperties(new ClassPathResource("application-test.properties"))
                .getProperty("de.flapdoodle.mongodb.embedded.version");

        String url = new PlatformPackageResolver(Command.MongoD)
                .packageFor(Distribution.of(Version.of(version), platform))
                .url();

        assertThat(url).startsWith(archivePrefix + version + ".");
    }

    private static Stream<Arguments> platforms() {
        return Stream.of(
                Arguments.of(
                        ImmutablePlatform.builder()
                                .operatingSystem(CommonOS.OS_X)
                                .architecture(CommonArchitecture.ARM_64)
                                .build(),
                        "/osx/mongodb-macos-arm64-"),
                Arguments.of(
                        ImmutablePlatform.builder()
                                .operatingSystem(CommonOS.OS_X)
                                .architecture(CommonArchitecture.X86_64)
                                .build(),
                        "/osx/mongodb-macos-x86_64-"),
                Arguments.of(ubuntu(CommonArchitecture.X86_64), "/linux/mongodb-linux-x86_64-ubuntu2204-"),
                Arguments.of(ubuntu(CommonArchitecture.ARM_64), "/linux/mongodb-linux-aarch64-ubuntu2204-"),
                Arguments.of(
                        ImmutablePlatform.builder()
                                .operatingSystem(CommonOS.Windows)
                                .architecture(CommonArchitecture.X86_64)
                                .build(),
                        "/windows/mongodb-windows-x86_64-"));
    }

    private static Platform ubuntu(CommonArchitecture architecture) {
        return ImmutablePlatform.builder()
                .operatingSystem(CommonOS.Linux)
                .architecture(architecture)
                .distribution(LinuxDistribution.Ubuntu)
                .version(UbuntuVersion.Ubuntu_22_04)
                .build();
    }
}
