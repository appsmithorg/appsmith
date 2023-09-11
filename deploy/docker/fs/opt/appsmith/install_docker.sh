#!/bin/bash

set -o errexit

is_command_present() {
    type "$1" >/dev/null 2>&1
}

is_mac() {
    [[ $OSTYPE == darwin* ]]
}
# This function checks if the relevant ports required by Appsmith are available or not
# The script should error out in case they aren't available
check_ports_occupied() {
    local port_check_output
    local ports_pattern="80|443"

    if is_mac; then
        port_check_output="$(netstat -anp tcp | awk '$6 == "LISTEN" && $4 ~ /^.*\.('"$ports_pattern"')$/')"
    elif is_command_present ss; then
        # The `ss` command seems to be a better/faster version of `netstat`, but is not available on all Linux
        # distributions by default. Other distributions have `ss` but no `netstat`. So, we try for `ss` first, then
        # fallback to `netstat`.
        port_check_output="$(ss --all --numeric --tcp | awk '$1 == "LISTEN" && $4 ~ /^.*:('"$ports_pattern"')$/')"
    elif is_command_present netstat; then
        port_check_output="$(netstat --all --numeric --tcp | awk '$6 == "LISTEN" && $4 ~ /^.*:('"$ports_pattern"')$/')"
    fi

    if [[ -n $port_check_output ]]; then
        echo "***************** ERROR *****************"
        echo "Appsmith requires ports 80 & 443 to be open. Please shut down any other service(s) that may be running on these ports."
        echo "You can run appsmith on another port following this guide https://docs.appsmith.com/v/v1.2.1/troubleshooting-guide/deployment-errors"
        echo "*****************************************"
        echo ""
        exit 1
    fi
}

install_docker() {
    echo "*****************************************"
    echo "Setting up docker repos"

    if [[ $package_manager == apt-get ]]; then
        apt_cmd="sudo apt-get --yes --quiet"
        $apt_cmd update
        $apt_cmd install software-properties-common gnupg-agent
        curl -fsSL "https://download.docker.com/linux/$os/gpg" | sudo apt-key add -
        sudo add-apt-repository \
            "deb [arch=amd64] https://download.docker.com/linux/$os $(lsb_release -cs) stable"
        $apt_cmd update
        echo "Installing docker"
        $apt_cmd install docker-ce docker-ce-cli containerd.io

    elif [[ $package_manager == zypper ]]; then
        zypper_cmd="sudo zypper --quiet --no-gpg-checks --non-interactive"
        echo "Installing docker"
        if [[ $os == sles ]]; then
            os_sp="$(cat /etc/*-release | awk -F= '$1 == "VERSION_ID" { gsub(/"/, ""); print $2; exit }')"
            os_arch="$(uname -i)"
            sudo SUSEConnect -p "sle-module-containers/$os_sp/$os_arch" -r ''
        fi
        $zypper_cmd install docker docker-runc containerd
        sudo systemctl enable docker.service

    else
        yum_cmd="sudo yum --assumeyes --quiet"
        $yum_cmd install yum-utils
        os_in_repo_link="$os"
        if [[ $os == rhel ]]; then
            # For RHEL, there's no separate repo link. We can use the CentOS one though.
            os_in_repo_link=centos
        fi
        sudo yum-config-manager --add-repo "https://download.docker.com/linux/$os_in_repo_link/docker-ce.repo"
        echo "Installing docker"
        $yum_cmd install docker-ce docker-ce-cli containerd.io
    fi
}

install_docker_compose() {
    if [[ $package_manager == "apt-get" || $package_manager == "zypper" || $package_manager == "yum" ]]; then
        if [[ ! -f /usr/bin/docker-compose ]];then
            echo "*****************************************"
            echo "Installing docker-compose"
            sudo curl -L "https://github.com/docker/compose/releases/download/1.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
            echo "docker-compose installed!"
            echo ""
        fi
    else
        echo "************* IMPORTANT READ *************"
        echo "docker-compose not found! Please install docker-compose first and then continue with this installation."
        echo "Refer https://docs.docker.com/compose/install/ for installing docker-compose."
        echo "******************************************"
        exit 1
    fi
}

start_docker() {
    if ! sudo systemctl is-active docker.service > /dev/null; then
        echo "Starting docker service"
        sudo systemctl start docker.service
    fi
}

check_os() {
    if is_mac; then
        package_manager="brew"
        desired_os=1
        os="mac"
        return
    fi

    local os_name="$(
        cat /etc/*-release \
            | awk -F= '$1 == "NAME" { gsub(/"/, ""); print $2; exit }' \
            | tr '[:upper:]' '[:lower:]'
    )"

    case "$os_name" in
        ubuntu*)
            desired_os=1
            os="ubuntu"
            package_manager="apt-get"
            ;;
        debian*)
            desired_os=1
            os="debian"
            package_manager="apt-get"
            ;;
        linux\ mint*)
            desired_os=1
            os="linux mint"
            package_manager="apt-get"
            ;;
        red\ hat*)
            desired_os=1
            os="rhel"
            package_manager="yum"
            ;;
        centos*)
            desired_os=1
            os="centos"
            package_manager="yum"
            ;;
        sles*)
            desired_os=1
            os="sles"
            package_manager="zypper"
            ;;
        opensuse*)
            desired_os=1
            os="opensuse"
            package_manager="zypper"
            ;;
        *)
            desired_os=0
            os="Not Found: $os_name"
    esac
}

confirm() {
    local default="$1"  # Should be `y` or `n`.
    local prompt="$2"

    local options="y/N"
    if [[ $default == y || $default == Y ]]; then
        options="Y/n"
    fi

    local answer
    read -rp "$prompt [$options] " answer
    if [[ -z $answer ]]; then
        # No answer given, the user just hit the Enter key. Take the default value as the answer.
        answer="$default"
    else
        # An answer was given. This means the user didn't get to hit Enter so the cursor on the same line. Do an empty
        # echo so the cursor moves to a new line.
        echo
    fi

    [[ yY =~ $answer ]]
}

echo_contact_support() {
    echo "Please contact <support@appsmith.com> with your OS details and version${1:-.}"
}

bye() {
    if [ "$?" -ne 0 ]; then
        set +o errexit
        exit 1
    fi
}

# Checking OS and assigning package manager
desired_os=0
os=""
echo -e "🕵️  Detecting your OS"
check_os

# Run bye if failure happens
trap bye EXIT

if [[ $desired_os -eq 0 ]];then
    echo ""
    echo "This script is currently meant to install Appsmith on Mac OS X, Ubuntu, Debian, Linux Mint, Red Hat, CentOS, SLES or openSUSE machines."
    echo_contact_support " if you wish to extend this support."
    exit 1
fi

check_ports_occupied

install_dir="$1"

if [[ -e "$install_dir" && -n "$(ls -A "$install_dir")" ]]; then
    echo "The path '$install_dir' is already present and is non-empty. Please run the script again with a different path to install new."
    echo_contact_support " if you're facing problems with the auto-updates."
    exit 1
fi

# Check is Docker daemon is installed and available. If not, the install & start Docker for Linux machines. We cannot automatically install Docker Desktop on Mac OS
if ! is_command_present docker; then
    if [[ $package_manager == "apt-get" || $package_manager == "zypper" || $package_manager == "yum" ]]; then
        install_docker
    else
        echo ""
        echo "***************** ERROR *****************"
        echo "Docker Desktop must be installed manually on Mac OS to proceed. Docker can only be installed automatically on Ubuntu / openSUSE / SLES / Redhat / Cent OS"
        echo "https://docs.docker.com/docker-for-mac/install/"
        echo "*****************************************"
        exit 1
    fi
fi

# Install docker-compose
if ! is_command_present docker-compose; then
    install_docker_compose
fi

# Starting docker service
if [[ $package_manager == "yum" || $package_manager == "zypper" || $package_manager == "apt-get" ]]; then
    start_docker
fi

# Add usergroup docker
sudo usermod -aG docker ${USER}