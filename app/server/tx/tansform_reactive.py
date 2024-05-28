from pathlib import Path
import re
from itertools import chain
import subprocess

root = Path(__file__).parent
while not (root / ".git").exists() and root != Path("/"):
    root = root.parent

server_root = root / "app/server"
FILE_CONTENTS_CACHE = {}

def replace_types_in_java_code(java_code):
    # Regex pattern to find class names
    class_pattern = r"(class|interface)\s+(Custom.*Repository.*)\s*\{([^}]*)\}"
    # Regex pattern to find method declarations
    method_pattern = r"((Optional|List)<.*>.*\(.*\))"

    # Find all classes that match the pattern
    classes = re.findall(class_pattern, java_code)

    for class_declaration in classes:
        class_name = class_declaration[1]
        class_body = class_declaration[2]

        # Find all method declarations in the class
        methods = re.findall(method_pattern, class_body)

        for method in methods:
            original_method = method[0]
            # Split the method declaration into return type and the rest
            return_type, rest_of_method = original_method.split(" ", 1)
            # Replace "Optional<" with "Mono<" and "List<" with "Flux<" in the return type only
            new_return_type = return_type.replace("Optional<", "Mono<").replace("List<", "Flux<")
            # Combine the new return type with the rest of the method
            new_method = new_return_type + " " + rest_of_method

            # Replace the method declaration in the class body
            class_body = class_body.replace(original_method, new_method)

        # Replace the class body in the java code
        java_code = java_code.replace(class_declaration[2], class_body)

    return java_code

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
                # f"{domain}RepositoryCE",
                f"Custom{domain}Repository",
                # f"{domain}Repository",
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
                # f"{domain}RepositoryCE",
                # f"Custom{domain}Repository",
                # f"{domain}Repository",
            ]
            ),
        )
    )

def switch_repo_types(domain):
    for full_path in chain(repo_interfaces(domain), repo_classes(domain)):
        content = (
            read_file(full_path)
            .replace("    Optional<", "    Mono<")
            .replace("    List<", "    Flux<")
            .replace("    int", "    Mono<Integer>")
            .replace(" public Optional<", " public Mono<")
            .replace(" public List<", " public Flux<")
            .replace(" public int", " public Mono<Integer>")
        )
        '''
        if "import reactor.core.publisher.Flux;" not in content:
            content = content.replace(
                ";\n\npublic interface", ";\nimport reactor.core.publisher.Flux;\n\npublic interface"
            )
        if "import reactor.core.publisher.Mono;" not in content:
            content = content.replace(
                ";\n\npublic interface", ";\nimport reactor.core.publisher.Mono;\n\npublic interface"
            )
        '''
        update_file(full_path, content)

def update_file(path: Path, content: str):
    if not path.exists() or path.read_text() != content:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        FILE_CONTENTS_CACHE[path] = content

def read_file(path: Path):
    if path not in FILE_CONTENTS_CACHE:
        FILE_CONTENTS_CACHE[path] = path.read_text()
    return FILE_CONTENTS_CACHE[path]

switch_repo_types("ActionCollection")
switch_repo_types("Application")
switch_repo_types("UserData")
switch_repo_types("User")
switch_repo_types("Workspace")
switch_repo_types("DatasourceStorageStructure")
switch_repo_types("NewPage")
switch_repo_types("Plugin")
switch_repo_types("NewAction")
switch_repo_types("PermissionGroup")
switch_repo_types("ApplicationSnapshot")
switch_repo_types("CustomJSLib")
switch_repo_types("Datasource")
switch_repo_types("Theme")
switch_repo_types("EmailVerificationToken")
switch_repo_types("Config")
switch_repo_types("PasswordResetToken")
switch_repo_types("DatasourceStorage")
switch_repo_types("Tenant")
switch_repo_types("Collection")
switch_repo_types("Asset")
switch_repo_types("UsagePulse")
switch_repo_types("GitDeployKeys")

# Trigger transform.py
# Path to the Python script you want to run
script_path = "./tx/transform.py"

# Run the script
subprocess.run(["python3", script_path])


