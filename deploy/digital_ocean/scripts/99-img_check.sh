#!/bin/bash

VERSION="v. 1.6"
RUNDATE=$( date )

# Script should be run with SUDO
if [ "$EUID" -ne 0 ]
  then echo "[Error] - This script must be run with sudo or as the root user."
  exit 1
fi

STATUS=0
PASS=0
WARN=0
FAIL=0

# $1 == command to check for
# returns: 0 == true, 1 == false
cmdExists() {
    if command -v "$1" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

function getDistro {
    if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
elif type lsb_release >/dev/null 2>&1; then
    # linuxbase.org
    OS=$(lsb_release -si)
    VER=$(lsb_release -sr)
elif [ -f /etc/lsb-release ]; then
    # For some versions of Debian/Ubuntu without lsb_release command
    . /etc/lsb-release
    OS=$DISTRIB_ID
    VER=$DISTRIB_RELEASE
elif [ -f /etc/debian_version ]; then
    # Older Debian/Ubuntu/etc.
    OS=Debian
    VER=$(cat /etc/debian_version)
elif [ -f /etc/SuSe-release ]; then
    # Older SuSE/etc.
    :
elif [ -f /etc/redhat-release ]; then
    # Older Red Hat, CentOS, etc.
    VER=$( cat /etc/redhat-release | cut -d" " -f3 | cut -d "." -f1)
    d=$( cat /etc/redhat-release | cut -d" " -f1 | cut -d "." -f1)
    if [[ $d == "CentOS" ]]; then
      OS="CentOS Linux"
    fi
else
    # Fall back to uname, e.g. "Linux <version>", also works for BSD, etc.
    OS=$(uname -s)
    VER=$(uname -r)
fi
}
function loadPasswords {
SHADOW=$(cat /etc/shadow)
}

function checkAgent {
  # Check for the presence of the do-agent in the filesystem
  if [ -d /var/opt/digitalocean/do-agent ];then
     echo -en "\e[41m[FAIL]\e[0m DigitalOcean Monitoring Agent detected.\n"
            ((FAIL++))
            STATUS=2
      if [[ $OS == "CentOS Linux" ]]; then
        echo "The agent can be removed with 'sudo yum remove do-agent' "
      elif [[ $OS == "Ubuntu" ]]; then
        echo "The agent can be removed with 'sudo apt-get purge do-agent' "
      fi
  else
    echo -en "\e[32m[PASS]\e[0m DigitalOcean Monitoring agent was not found\n"
    ((PASS++))
  fi
}

function checkLogs {
    cp_ignore="/var/log/cpanel-install.log"
    echo -en "\nChecking for log files in /var/log\n\n"
    # Check if there are log archives or log files that have not been recently cleared.
    for f in /var/log/*-????????; do
      [[ -e $f ]] || break
      if [ $f != $cp_ignore ]; then
        echo -en "\e[93m[WARN]\e[0m Log archive ${f} found\n"
        ((WARN++))
        if [[ $STATUS != 2 ]]; then
            STATUS=1
        fi
      fi
    done
    for f in  /var/log/*.[0-9];do
      [[ -e $f ]] || break
        echo -en "\e[93m[WARN]\e[0m Log archive ${f} found\n"
        ((WARN++))
        if [[ $STATUS != 2 ]]; then
            STATUS=1
        fi
    done
    for f in /var/log/*.log; do
      [[ -e $f ]] || break
      if [[ "${f}" = '/var/log/lfd.log' && "$( cat "${f}" | egrep -v '/var/log/messages has been reset| Watching /var/log/messages' | wc -c)" -gt 50 ]]; then
        if [ $f != $cp_ignore ]; then
        echo -en "\e[93m[WARN]\e[0m un-cleared log file, ${f} found\n"
        ((WARN++))
        if [[ $STATUS != 2 ]]; then
            STATUS=1
        fi
      fi
      elif [[ "${f}" != '/var/log/lfd.log' && "$( cat "${f}" | wc -c)" -gt 50 ]]; then
      if [ $f != $cp_ignore ]; then
        echo -en "\e[93m[WARN]\e[0m un-cleared log file, ${f} found\n"
        ((WARN++))
        if [[ $STATUS != 2 ]]; then
            STATUS=1
        fi
      fi
    fi
    done
}
function checkTMP {
  # Check the /tmp directory to ensure it is empty.  Warn on any files found.
  return 1
}
function checkRoot {
    user="root"
    uhome="/root"
    for usr in $SHADOW
    do
      IFS=':' read -r -a u <<< "$usr"
      if [[ "${u[0]}" == "${user}" ]]; then
        if [[ ${u[1]} == "!" ]] || [[ ${u[1]} == "!!" ]] || [[ ${u[1]} == "*" ]]; then
            echo -en "\e[32m[PASS]\e[0m User ${user} has no password set.\n"
            ((PASS++))
        else
            echo -en "\e[41m[FAIL]\e[0m User ${user} has a password set on their account.\n"
            ((FAIL++))
            STATUS=2
        fi
      fi
    done
    if [ -d ${uhome}/ ]; then
            if [ -d ${uhome}/.ssh/ ]; then
                if  ls ${uhome}/.ssh/*> /dev/null 2>&1; then
                    for key in ${uhome}/.ssh/*
                        do
                             if  [ "${key}" == "${uhome}/.ssh/authorized_keys" ]; then

                                if [ "$( cat "${key}" | wc -c)" -gt 50 ]; then
                                    echo -en "\e[41m[FAIL]\e[0m User \e[1m${user}\e[0m has a populated authorized_keys file in \e[93m${key}\e[0m\n"
                                    akey=$(cat ${key})
                                    echo "File Contents:"
                                    echo $akey
                                    echo "--------------"
                                    ((FAIL++))
                                    STATUS=2
                                fi
                            elif  [ "${key}" == "${uhome}/.ssh/id_rsa" ]; then
                                if [ "$( cat "${key}" | wc -c)" -gt 0 ]; then
                                  echo -en "\e[41m[FAIL]\e[0m User \e[1m${user}\e[0m has a private key file in \e[93m${key}\e[0m\n"
                                      akey=$(cat ${key})
                                      echo "File Contents:"
                                      echo $akey
                                      echo "--------------"
                                      ((FAIL++))
                                      STATUS=2
                                else
                                  echo -en "\e[93m[WARN]\e[0m User \e[1m${user}\e[0m has empty private key file in \e[93m${key}\e[0m\n"
                                  ((WARN++))
                                  if [[ $STATUS != 2 ]]; then
                                    STATUS=1
                                  fi
                                fi
                            elif  [ "${key}" != "${uhome}/.ssh/known_hosts" ]; then
                                 echo -en "\e[93m[WARN]\e[0m User \e[1m${user}\e[0m has a file in their .ssh directory at \e[93m${key}\e[0m\n"
                                    ((WARN++))
                                    if [[ $STATUS != 2 ]]; then
                                        STATUS=1
                                    fi
                            else
                                if [ "$( cat "${key}" | wc -c)" -gt 50 ]; then
                                    echo -en "\e[93m[WARN]\e[0m User \e[1m${user}\e[0m has a populated known_hosts file in \e[93m${key}\e[0m\n"
                                    ((WARN++))
                                    if [[ $STATUS != 2 ]]; then
                                        STATUS=1
                                    fi
                                fi
                            fi
                        done
                else
                    echo -en "\e[32m[ OK ]\e[0m User \e[1m${user}\e[0m has no SSH keys present\n"
                fi
            else
                echo -en "\e[32m[ OK ]\e[0m User \e[1m${user}\e[0m does not have an .ssh directory\n"
            fi
             if [ -f /root/.bash_history ];then

                      BH_S=$( cat /root/.bash_history | wc -c)

                      if [[ $BH_S -lt 200 ]]; then
                          echo -en "\e[32m[PASS]\e[0m ${user}'s Bash History appears to have been cleared\n"
                          ((PASS++))
                      else
                          echo -en "\e[41m[FAIL]\e[0m ${user}'s Bash History should be cleared to prevent sensitive information from leaking\n"
                          ((FAIL++))
                              STATUS=2
                      fi

                      return 1;
                  else
                      echo -en "\e[32m[PASS]\e[0m The Root User's Bash History is not present\n"
                      ((PASS++))
                  fi
        else
            echo -en "\e[32m[ OK ]\e[0m User \e[1m${user}\e[0m does not have a directory in /home\n"
        fi
        echo -en "\n\n"
    return 1
}

function checkUsers {
    # Check each user-created account
    for user in $(awk -F: '$3 >= 1000 && $1 != "nobody" {print $1}' /etc/passwd;)
    do
      # Skip some other non-user system accounts
      if [[ $user == "centos" ]]; then
        :
      elif [[ $user == "nfsnobody" ]]; then
        :
    else
      echo -en "\nChecking user: ${user}...\n"
      for usr in $SHADOW
        do
          IFS=':' read -r -a u <<< "$usr"
          if [[ "${u[0]}" == "${user}" ]]; then
              if [[ ${u[1]} == "!" ]] || [[ ${u[1]} == "!!" ]] || [[ ${u[1]} == "*" ]]; then
                  echo -en "\e[32m[PASS]\e[0m User ${user} has no password set.\n"
                  ((PASS++))
              else
                  echo -en "\e[41m[FAIL]\e[0m User ${user} has a password set on their account. Only system users are allowed on the image.\n"
                  ((FAIL++))
                  STATUS=2
              fi
          fi
        done
        #echo "User Found: ${user}"
        uhome="/home/${user}"
        if [ -d "${uhome}/" ]; then
            if [ -d "${uhome}/.ssh/" ]; then
                if  ls "${uhome}/.ssh/*"> /dev/null 2>&1; then
                    for key in ${uhome}/.ssh/*
                        do
                            if  [ "${key}" == "${uhome}/.ssh/authorized_keys" ]; then
                                if [ "$( cat "${key}" | wc -c)" -gt 50 ]; then
                                    echo -en "\e[41m[FAIL]\e[0m User \e[1m${user}\e[0m has a populated authorized_keys file in \e[93m${key}\e[0m\n"
                                    akey=$(cat ${key})
                                    echo "File Contents:"
                                    echo $akey
                                    echo "--------------"
                                    ((FAIL++))
                                    STATUS=2
                                fi
                              elif  [ "${key}" == "${uhome}/.ssh/id_rsa" ]; then
                                if [ "$( cat "${key}" | wc -c)" -gt 0 ]; then
                                  echo -en "\e[41m[FAIL]\e[0m User \e[1m${user}\e[0m has a private key file in \e[93m${key}\e[0m\n"
                                      akey=$(cat ${key})
                                      echo "File Contents:"
                                      echo $akey
                                      echo "--------------"
                                      ((FAIL++))
                                      STATUS=2
                                else
                                  echo -en "\e[93m[WARN]\e[0m User \e[1m${user}\e[0m has empty private key file in \e[93m${key}\e[0m\n"
                                  ((WARN++))
                                  if [[ $STATUS != 2 ]]; then
                                    STATUS=1
                                  fi
                                fi
                            elif  [ "${key}" != "${uhome}/.ssh/known_hosts" ]; then

                                 echo -en "\e[93m[WARN]\e[0m User \e[1m${user}\e[0m has a file in their .ssh directory named \e[93m${key}\e[0m\n"
                                 ((WARN++))
                                 if [[ $STATUS != 2 ]]; then
                                        STATUS=1
                                    fi

                            else
                                if [ "$( cat "${key}" | wc -c)" -gt 50 ]; then
                                    echo -en "\e[93m[WARN]\e[0m User \e[1m${user}\e[0m has a known_hosts file in \e[93m${key}\e[0m\n"
                                    ((WARN++))
                                    if [[ $STATUS != 2 ]]; then
                                        STATUS=1
                                    fi
                                fi
                            fi


                        done
                else
                    echo -en "\e[32m[ OK ]\e[0m User \e[1m${user}\e[0m has no SSH keys present\n"
                fi
            else
                echo -en "\e[32m[ OK ]\e[0m User \e[1m${user}\e[0m does not have an .ssh directory\n"
            fi
        else
            echo -en "\e[32m[ OK ]\e[0m User \e[1m${user}\e[0m does not have a directory in /home\n"
        fi

         # Check for an uncleared .bash_history for this user
              if [ -f "${uhome}/.bash_history" ]; then
                            BH_S=$( cat "${uhome}/.bash_history" | wc -c )

                            if [[ $BH_S -lt 200 ]]; then
                                echo -en "\e[32m[PASS]\e[0m ${user}'s Bash History appears to have been cleared\n"
                                ((PASS++))
                            else
                                echo -en "\e[41m[FAIL]\e[0m ${user}'s Bash History should be cleared to prevent sensitive information from leaking\n"
                                ((FAIL++))
                                    STATUS=2

                            fi
                           echo -en "\n\n"
                         fi
        fi
    done
}
function checkFirewall {

    if [[ $OS == "Ubuntu" ]]; then
      fw="ufw"
      ufwa=$(ufw status |head -1| sed -e "s/^Status:\ //")
      if [[ $ufwa == "active" ]]; then
        FW_VER="\e[32m[PASS]\e[0m Firewall service (${fw}) is active\n"
        ((PASS++))
      else
        FW_VER="\e[93m[WARN]\e[0m No firewall is configured. Ensure ${fw} is installed and configured\n"
        ((WARN++))
      fi
    elif [[ $OS == "CentOS Linux" ]]; then
      if [ -f /usr/lib/systemd/system/csf.service ]; then
        fw="csf"
        if [[ $(systemctl status $fw >/dev/null 2>&1) ]]; then

        FW_VER="\e[32m[PASS]\e[0m Firewall service (${fw}) is active\n"
        ((PASS++))
        elif cmdExists "firewall-cmd"; then
          if [[ $(systemctl is-active firewalld >/dev/null 2>&1 && echo 1 || echo 0) ]]; then
           FW_VER="\e[32m[PASS]\e[0m Firewall service (${fw}) is active\n"
          ((PASS++))
          else
            FW_VER="\e[93m[WARN]\e[0m No firewall is configured. Ensure ${fw} is installed and configured\n"
          ((WARN++))
          fi
        else
          FW_VER="\e[93m[WARN]\e[0m No firewall is configured. Ensure ${fw} is installed and configured\n"
        ((WARN++))
        fi
      else
        fw="firewalld"
        if [[ $(systemctl is-active firewalld >/dev/null 2>&1 && echo 1 || echo 0) ]]; then
          FW_VER="\e[32m[PASS]\e[0m Firewall service (${fw}) is active\n"
        ((PASS++))
        else
          FW_VER="\e[93m[WARN]\e[0m No firewall is configured. Ensure ${fw} is installed and configured\n"
        ((WARN++))
        fi
      fi
    elif [[ "$OS" =~ Debian.* ]]; then
      # user could be using a number of different services for managing their firewall
      # we will check some of the most common
      if cmdExists 'ufw'; then
        fw="ufw"
        ufwa=$(ufw status |head -1| sed -e "s/^Status:\ //")
        if [[ $ufwa == "active" ]]; then
        FW_VER="\e[32m[PASS]\e[0m Firewall service (${fw}) is active\n"
        ((PASS++))
      else
        FW_VER="\e[93m[WARN]\e[0m No firewall is configured. Ensure ${fw} is installed and configured\n"
        ((WARN++))
      fi
      elif cmdExists "firewall-cmd"; then
        fw="firewalld"
        if [[ $(systemctl is-active --quiet $fw) ]]; then
          FW_VER="\e[32m[PASS]\e[0m Firewall service (${fw}) is active\n"
        ((PASS++))
        else
          FW_VER="\e[93m[WARN]\e[0m No firewall is configured. Ensure ${fw} is installed and configured\n"
        ((WARN++))
        fi
      else
        # user could be using vanilla iptables, check if kernel module is loaded
        fw="iptables"
        if [[ $(lsmod | grep -q '^ip_tables' 2>/dev/null) ]]; then
          FW_VER="\e[32m[PASS]\e[0m Firewall service (${fw}) is active\n"
        ((PASS++))
        else
          FW_VER="\e[93m[WARN]\e[0m No firewall is configured. Ensure ${fw} is installed and configured\n"
        ((WARN++))
        fi
      fi
    fi

}
function checkUpdates {
    if [[ $OS == "Ubuntu" ]] || [[ "$OS" =~ Debian.* ]]; then
        # Ensure /tmp exists and has the proper permissions before
        # checking for security updates
        # https://github.com/digitalocean/marketplace-partners/issues/94
        if [[ ! -d /tmp ]]; then
          mkdir /tmp
        fi
        chmod 1777 /tmp

        echo -en "\nUpdating apt package database to check for security updates, this may take a minute...\n\n"
        apt-get -y update > /dev/null

        uc=$(apt-get --just-print upgrade | grep -i "security" | wc -l)
        if [[ $uc -gt 0 ]]; then
          update_count=$(( ${uc} / 2 ))
        else
          update_count=0
        fi

        if [[ $update_count -gt 0 ]]; then
            echo -en "\e[41m[FAIL]\e[0m There are ${update_count} security updates available for this image that have not been installed.\n"
            echo -en
            echo -en "Here is a list of the security updates that are not installed:\n"
            sleep 2
            apt-get --just-print upgrade | grep -i security | awk '{print $2}' | awk '!seen[$0]++'
            echo -en
            ((FAIL++))
            STATUS=2
        else
            echo -en "\e[32m[PASS]\e[0m There are no pending security updates for this image.\n\n"
        fi
    elif [[ $OS == "CentOS Linux" ]]; then
        echo -en "\nChecking for available security updates, this may take a minute...\n\n"

        update_count=$(yum check-update --security --quiet | wc -l)
         if [[ $update_count -gt 0 ]]; then
            echo -en "\e[41m[FAIL]\e[0m There are ${update_count} security updates available for this image that have not been installed.\n"
            ((FAIL++))
            STATUS=2
        else
            echo -en "\e[32m[PASS]\e[0m There are no pending security updates for this image.\n"
            ((PASS++))
        fi
    else
        echo "Error encountered"
        exit 1
    fi

    return 1;
}
function checkCloudInit {

    if hash cloud-init 2>/dev/null; then
        CI="\e[32m[PASS]\e[0m Cloud-init is installed.\n"
        ((PASS++))
    else
        CI="\e[41m[FAIL]\e[0m No valid verison of cloud-init was found.\n"
        ((FAIL++))
        STATUS=2
    fi
    return 1
}

function version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }


clear
echo "DigitalOcean Marketplace Image Validation Tool ${VERSION}"
echo "Executed on: ${RUNDATE}"
echo "Checking local system for Marketplace compatibility..."

getDistro

echo -en "\n\e[1mDistribution:\e[0m ${OS}\n"
echo -en "\e[1mVersion:\e[0m ${VER}\n\n"

ost=0
osv=0

if [[ $OS == "Ubuntu" ]]; then
        ost=1
    if [[ $VER == "20.04" ]]; then
        osv=1
    elif [[ $VER == "18.04" ]]; then
        osv=1
    elif [[ $VER == "16.04" ]]; then
        osv=1
    else
        osv=0
    fi

elif [[ "$OS" =~ Debian.* ]]; then
    ost=1
    case "$VER" in
        9)
            osv=1
            ;;
        10)
            osv=1
            ;;
        *)
            osv=2
            ;;
    esac

elif [[ $OS == "CentOS Linux" ]]; then
        ost=1
    if [[ $VER == "8" ]]; then
        osv=1
    elif [[ $VER == "7" ]]; then
        osv=1
    elif [[ $VER == "6" ]]; then
        osv=1
    else
        osv=2
    fi
else
    ost=0
fi

if [[ $ost == 1 ]]; then
    echo -en "\e[32m[PASS]\e[0m Supported Operating System Detected: ${OS}\n"
    ((PASS++))
else
    echo -en "\e[41m[FAIL]\e[0m ${OS} is not a supported Operating System\n"
    ((FAIL++))
    STATUS=2
fi

if [[ $osv == 1 ]]; then
    echo -en "\e[32m[PASS]\e[0m Supported Release Detected: ${VER}\n"
    ((PASS++))
elif [[ $ost == 1 ]]; then
    echo -en "\e[41m[FAIL]\e[0m ${OS} ${VER} is not a supported Operating System Version\n"
    ((FAIL++))
    STATUS=2
else
    echo "Exiting..."
    exit 1
fi

checkCloudInit

echo -en "${CI}"

checkFirewall

echo -en "${FW_VER}"

checkUpdates

loadPasswords

checkLogs

echo -en "\n\nChecking all user-created accounts...\n"
checkUsers

echo -en "\n\nChecking the root account...\n"
checkRoot

checkAgent


# Summary
echo -en "\n\n---------------------------------------------------------------------------------------------------\n"

if [[ $STATUS == 0 ]]; then
    echo -en "Scan Complete.\n\e[32mAll Tests Passed!\e[0m\n"
elif [[ $STATUS == 1 ]]; then
    echo -en "Scan Complete. \n\e[93mSome non-critical tests failed.  Please review these items.\e[0m\e[0m\n"
else
    echo -en "Scan Complete. \n\e[41mOne or more tests failed.  Please review these items and re-test.\e[0m\n"
fi
echo "---------------------------------------------------------------------------------------------------"
echo -en "\e[1m${PASS} Tests PASSED\e[0m\n"
echo -en "\e[1m${WARN} WARNINGS\e[0m\n"
echo -en "\e[1m${FAIL} Tests FAILED\e[0m\n"
echo -en "---------------------------------------------------------------------------------------------------\n"

if [[ $STATUS == 0 ]]; then
    echo -en "We did not detect any issues with this image. Please be sure to manually ensure that all software installed on the base system is functional, secure and properly configured (or facilities for configuration on first-boot have been created).\n\n"
    exit 0
elif [[ $STATUS == 1 ]]; then
    echo -en "Please review all [WARN] items above and ensure they are intended or resolved.  If you do not have a specific requirement, we recommend resolving these items before image submission\n\n"
    exit 0
else
    echo -en "Some critical tests failed.  These items must be resolved and this scan re-run before you submit your image to the DigitalOcean Marketplace.\n\n"
    exit 1
fi