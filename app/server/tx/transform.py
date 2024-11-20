from collections import namedtuple
from pathlib import Path
import re
from textwrap import dedent, indent
from itertools import chain
import subprocess
import os
import glob

root = Path(__file__).parent
while not (root / ".git").exists() and root != Path("/"):
    root = root.parent

server_root = root / "app/server"
FILE_CONTENTS_CACHE = {}

# PERMISSION_ARG = "userAclPermission"

SUBSCRIBE_WRAPPER = (
    "%s.subscribeOn(Schedulers.boundedElastic())"
)
MONO_WRAPPER = "asMono(() -> %s)"
MONO_WRAPPER_NON_OPTIONAL = (
    SUBSCRIBE_WRAPPER % "Mono.fromSupplier(() -> %s)"
)
FLUX_WRAPPER = "asFlux(() -> %s)"
FLUX_WRAPPER_WITH_USER_CONTEXT = "ReactiveContextUtils.getCurrentUser().zipWith(Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))).flatMapMany(tuple2 -> %s)"
MONO_WRAPPER_WITH_USER_CONTEXT = "ReactiveContextUtils.getCurrentUser().zipWith(Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))).flatMap(tuple2 -> %s)"


def apply(p, tx):
    update_file(p, tx(read_file(p)))


def add_postgres_dep(content: str):
    if "<artifactId>postgresql</artifactId>" in content:
        return content
    return content.replace(
        "<dependencies>",
        """<dependencies>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>""",
        1,
    )


def del_postgres_dep(content: str):
    return content.replace(
        """
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>""",
        "",
    )


def repo_interfaces(domain):
    return list(
        filter(
            Path.exists,
            (
                (
                    server_root
                    / f"appsmith-server/src/main/java/com/appsmith/server/repositories/{'ce/' if 'CE' in g else ''}{g}.java"
                )
                for g in [
                    f"Custom{domain}RepositoryCE",
                    f"{domain}RepositoryCE",
                    # f"Custom{domain}Repository",
                    f"{domain}Repository",
                ]
            ),
        )
    )


def repo_classes(domain):
    return list(
        filter(
            Path.exists,
            (
                (
                    server_root
                    / f"appsmith-server/src/main/java/com/appsmith/server/repositories/{'ce/' if 'CE' in g else ''}{g}.java"
                )
                for g in [
                    f"Custom{domain}RepositoryCEImpl",
                    # f"Custom{domain}RepositoryImpl",
                ]
            ),
        )
    )


def switch_repo_types(domain):
    for full_path in chain(repo_interfaces(domain), repo_classes(domain)):
        content = (
            read_file(full_path)
            .replace("    Mono<", "    Optional<")
            .replace("    Flux<", "    List<")
            .replace(" public Mono<", " public Optional<")
            .replace(" public Flux<", " public List<")
        )
        if "import java.util.List;" not in content:
            content = content.replace(
                ";\n\npublic interface", ";\nimport java.util.List;\n\npublic interface"
            )
        if "import java.util.Optional;" not in content:
            content = content.replace(
                ";\n\npublic interface",
                ";\nimport java.util.Optional;\n\npublic interface",
            )
        if "import com.appsmith.server.domains.User;" not in content:
            content = content.replace(
                ";\n\npublic interface",
                ";\nimport com.appsmith.server.domains.User;\n\npublic interface",
            )
        update_file(full_path, content)


def add_user_arg(domain):
    for full_path in chain(repo_interfaces(domain), repo_classes(domain)):
        content = (
            read_file(full_path)
            .replace("aclPermission", "permission")
            .replace("optionalPermission", "permission")
            .replace("AclPermission permission", "AclPermission permission, User currentUser")
            .replace("Optional<AclPermission> permission", "Optional<AclPermission> permission, User currentUser")
        )
        # Remove duplicate User currentUser arguments
        regex = r"User\s+currentUser,\s*User\s+currentUser"
        subst = "User currentUser"
        content = re.sub(regex, subst, content)
        update_file(full_path, content)

def add_entity_manager_arg(domain):
    for full_path in chain(repo_interfaces(domain)):
        content = (
            read_file(full_path)
            .replace(");", ", EntityManager entityManager);")
        )
        # Remove duplicate User currentUser arguments
        regex = r"EntityManager\s+entityManager,\s*EntityManager\s+entityManager"
        subst = "EntityManager entityManager"
        content = re.sub(regex, subst, content)
        update_file(full_path, content)
    for full_path in chain(repo_classes(domain)):
        content = (
            read_file(full_path)
        )
        # Append EntityManager entityManager to method arguments
        content = re.sub(
            r"(public\s+\S+\s+\w+\s*\([^)]*?)\)",
            r"\1, EntityManager entityManager)",
            content
        )
        # Remove duplicate EntityManager entityManager arguments
        regex = r"EntityManager\s+entityManager,\s*EntityManager\s+entityManager"
        subst = "EntityManager entityManager"
        content = re.sub(regex, subst, content)
        update_file(full_path, content)

def replace_exact_word(text, old_word, new_word):
    # Create a regex pattern to match the exact word
    pattern = r'\b' + old_word + r'\b'

    # Use the re.sub() function to replace the exact word
    text = re.sub(pattern, new_word, text)

    return text


def generate_cake_class(domain):
    Method = namedtuple("Method", "return_type signature ref")
    methods: set[Method] = set()
    reactor_methods = []

    extra_repo_interfaces = ["BaseRepository"]
    if any(
        "extends AppsmithRepository<" in read_file(p) for p in repo_interfaces(domain)
    ):
        extra_repo_interfaces.append("AppsmithRepository")

    for full_path in chain(
        repo_interfaces(domain),
        (
            (
                server_root
                / f"appsmith-server/src/main/java/com/appsmith/server/repositories/{f}.java"
            )
            for f in extra_repo_interfaces
        ),
    ):
        content = read_file(full_path)
        if domain not in full_path.name:
            content = re.sub(r"\bT\b", domain, content)
            content = re.sub(r"\bID\b", "String", content)

        # because of unambiguous error for this class with the one in `domains` package.
        content = re.sub(r"\bCollection<", "java.util.Collection<", content)

        # Compute source of this method for reference.
        package = next(re.finditer(r"^package (.+?);$", content, re.MULTILINE))[1]
        class_name = next(
            re.finditer(r"^public (interface|class) (\w+)", content, re.MULTILINE)
        )[2]

        match: re.Match
        for match in re.finditer(
            r"^ {4}(?:default )?[\w<>?]+\s+\w+\([^)]*\)",
            content,
            re.DOTALL | re.MULTILINE,
        ):
            full = re.sub(
                r"\s+", " ", match[0].strip().replace("default ", "")
            ).replace("( ", "(")
            return_type, signature = full.split(None, 1)
            signature_for_ref = re.sub(r" \w+([,)])", r"\1", signature)
            signature_for_ref = re.sub(
                r"\b" + domain + r"\b", "BaseDomain", signature_for_ref
            )
            methods.add(
                Method(
                    return_type=return_type,
                    signature=signature,
                    ref=f"{package}.{class_name}#{signature_for_ref}",
                )
            )

    for method in sorted(methods, key=lambda m: m.signature):
        ret_type, signature, *_ = method

        if ret_type.startswith("Optional"):
            ret_type = ret_type.replace("Optional", "Mono")
            wrapper = MONO_WRAPPER_WITH_USER_CONTEXT % MONO_WRAPPER if "AclPermission" in signature else MONO_WRAPPER
        elif ret_type.startswith(("List", "Iterable")):
            ret_type = ret_type.replace("List", "Flux").replace("Iterable", "Flux")
            wrapper = FLUX_WRAPPER_WITH_USER_CONTEXT % FLUX_WRAPPER if "AclPermission" in signature else FLUX_WRAPPER
        elif ret_type.startswith("Mono<"):
            wrapper = SUBSCRIBE_WRAPPER
        elif not ret_type.islower():
            ret_type = ("Mono<" + ret_type + ">")
            wrapper = MONO_WRAPPER_WITH_USER_CONTEXT % MONO_WRAPPER_NON_OPTIONAL if "AclPermission" in signature else MONO_WRAPPER_NON_OPTIONAL
        elif ret_type == "int":
            ret_type = "Mono<Integer>"
            wrapper = MONO_WRAPPER_WITH_USER_CONTEXT % MONO_WRAPPER_NON_OPTIONAL if "AclPermission" in signature else MONO_WRAPPER_NON_OPTIONAL
        else:
            wrapper = "%s"

        signature = signature.replace(f"BaseRepository<{domain}, String>", f"{domain}RepositoryCake")

        call = signature
        while "<" in call:
            # Remove all generics in type definitions.
            call = re.sub(r"<[^<>]+?>", "", call)

        signature_wo_user_context = replace_exact_word(signature, ", User currentUser", "")
        signature_wo_user_context = replace_exact_word(signature_wo_user_context, ", EntityManager entityManager", "")
        call = re.sub(
            # Replace type declarations, and leave the argument names.
            r"[A-Za-z.]+?\s(\w+)([,)])", r"\1\2", call
        ).replace("baseRepository", "repository")
        reactor_methods.append(
            f"/** @see {method.ref} */\n"
            + "public "
            + ret_type
            + " "
            + signature_wo_user_context
            + " {\n    return "
            + (wrapper % ("repository." + call))
            + ";\n}\n"
        )

    content = indent("\n".join(reactor_methods), " " * 4)

    imports = set()
    if "<UpdateResult>" in content:
        imports.add("com.mongodb.client.result.UpdateResult")
    if "PluginTypeAndCountDTO" in content:
        imports.add("com.appsmith.server.dtos.PluginTypeAndCountDTO")
    if "CustomJSLibContextDTO" in content:
        imports.add("com.appsmith.server.dtos.CustomJSLibContextDTO")

    imports_code = "".join(f"import {i};" for i in imports)

    prefix = dedent(
        f"""\
    package com.appsmith.server.repositories.cakes;

    import com.appsmith.external.models.*;
    import com.appsmith.server.acl.AclPermission;
    import com.appsmith.server.domains.User;
    import com.appsmith.server.domains.*;
    import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
    import com.appsmith.server.newactions.projections.*;
    import com.appsmith.server.projections.*;
    import com.appsmith.server.repositories.*;
    import com.appsmith.server.helpers.ReactiveContextUtils;
    import com.appsmith.server.repositories.ce.params.QueryAllParams;
    import jakarta.persistence.EntityManager;
    import org.springframework.stereotype.Component;
    import org.springframework.data.domain.Sort;
    import reactor.core.publisher.Flux;
    import reactor.core.publisher.Mono;
    import reactor.core.scheduler.Schedulers;
    {imports_code}

    import java.time.Instant;
    import java.util.List;
    import java.util.Map;
    import java.util.Optional;
    import java.util.Set;

    import static com.appsmith.server.constants.FieldName.TX_CONTEXT;
    import static com.appsmith.server.helpers.ReactorUtils.asFlux;
    import static com.appsmith.server.helpers.ReactorUtils.asMono;

    @Component
    public class {domain}RepositoryCake extends BaseCake<{domain}, {domain}Repository> {{
        private final {domain}Repository repository;
        private final EntityManager entityManager;

        public {domain}RepositoryCake({domain}Repository repository, EntityManager entityManager) {{
            super(repository, {domain}.class);
            this.repository = repository;
            this.entityManager = entityManager;
        }}

        {f"public QueryAllParams<{domain}> queryBuilder() {{ return repository.queryBuilder(); }}"
        if "AppsmithRepository" in extra_repo_interfaces else ""}

        // From CrudRepository
        public Flux<{domain}> saveAll(Iterable<{domain}> entities) {{
            return {FLUX_WRAPPER % "repository.saveAll(entities)"};
        }}
        // End from CrudRepository
    """
    )

    gen_src = prefix.strip() + "\n\n" + content + "\n}\n"

    try:
        repo_class_path = next(server_root.rglob(domain + "Repository.java"))
    except StopIteration:
        print(f"Could not find {domain}Repository.java")
        return

    update_file(
        repo_class_path.parent / f"cakes/{domain}RepositoryCake.java",
        gen_src,
    )


def use_cake(domain):
    for path in chain(
        server_root.rglob("*ServiceImpl.java"),
        server_root.rglob("*ServiceCEImpl.java"),
        server_root.rglob("*ServiceCECompatibleImpl.java"),
        server_root.rglob("AuthenticationSuccessHandler*.java"),
        server_root.rglob("PingScheduledTask*Impl.java"),
        server_root.rglob("UserChangedHandler*Impl.java"),
        server_root.glob("**/solutions/*.java"),
        server_root.glob("**/solutions/ce/*.java"),
        server_root.glob("**/com/appsmith/server/helpers/*.java"),
        server_root.glob("**/com/appsmith/server/helpers/ce/*.java"),
        server_root.glob("appsmith-server/src/test/java/**/*.java"),
    ):
        out = re.sub(rf"\b({domain}Repository)\b", r"\1Cake", read_file(path))
        out = re.sub(
            r"(import com\.appsmith\.server\.repositories\.)(\w+?Cake;)",
            r"\1cakes.\2",
            out,
        )
        update_file(path, out)


def to_entity(domain: str):
    path = next(server_root.rglob(f"{domain}.java"))

    content = read_file(path)

    content = content.replace("@Document", "@Entity").replace(
        "org.springframework.data.mongodb.core.mapping.Document",
        "jakarta.persistence.Entity",
    )

    if " extends BaseDomain {" not in content and "@Id" not in content:
        id_field = indent(
            "\n".join(
                [
                    # todo: need import statements for these.
                    "@Id",
                    "@GeneratedValue(strategy = GenerationType.UUID)",
                    "private String id;",
                ]
            ),
            " " * 4,
        )
        content = re.sub(
            f"(public class {domain} (implements AppsmithDomain )?{{)\n+",
            f"\\1\n\n{id_field}\n\n",
            content,
        )

    update_file(path, content)


def read_file(path: Path):
    if path not in FILE_CONTENTS_CACHE:
        FILE_CONTENTS_CACHE[path] = path.read_text()
    return FILE_CONTENTS_CACHE[path]


def update_file(path: Path, content: str):
    if not path.exists() or path.read_text() != content:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        FILE_CONTENTS_CACHE[path] = content


def convert(domain):
    print("Bake", domain)
    domain_class_content = read_file(next(root.glob(f"app/server/**/{domain}.java")))
    if (
        "@Entity\n" not in domain_class_content
        and "@Document\n" not in domain_class_content
    ):
        raise ValueError(f"{domain} is not a DB Document")

    to_entity(domain)
    # switch_repo_types(domain)
    add_user_arg(domain)
    add_entity_manager_arg(domain)
    generate_cake_class(domain)
    # use_cake(domain)  # Commenting this out since we want both cake and repo to co-exist now.


def cleanup():
    print("Cleaning up old cake classes")
    for filename in glob.iglob('./**/*RepositoryCake.java', root_dir=server_root, recursive=True):
        os.remove(filename)


def main():
    apply(root / "app/server/appsmith-interfaces/pom.xml", add_postgres_dep)
    apply(root / "app/server/appsmith-plugins/postgresPlugin/pom.xml", del_postgres_dep)
    cleanup()

    add_user_arg("Appsmith")
    convert("ActionCollection")
    convert("Application")
    convert("UserData")
    convert("User")
    convert("Workspace")
    convert("DatasourceStorageStructure")
    convert("NewPage")
    convert("Plugin")
    convert("NewAction")
    convert("PermissionGroup")
    convert("ApplicationSnapshot")
    convert("CustomJSLib")
    convert("Datasource")
    convert("Theme")
    convert("EmailVerificationToken")
    convert("Config")
    convert("PasswordResetToken")
    convert("DatasourceStorage")
    convert("Tenant")
    convert("Collection")
    convert("Asset")
    convert("UsagePulse")
    convert("GitDeployKeys")

    print("\nApplying spotless...")
    subprocess.check_call(
        [
            "mvn",
            "-Dorg.slf4j.simpleLogger.defaultLogLevel=warn",
            "spotless:apply",
        ],
        cwd=server_root,
    )


if __name__ == "__main__":
    main()
