#!/bin/bash
# +----------------+
# | npm preinstall |
# +----------------+

dependencies=

while getopts ":d:" option; do
  case $option in
    d) # -d option for install dependencies
       dependencies=($OPTARG);;
  esac
done

# get the installer directory
Installer_get_current_dir () {
  SOURCE="${BASH_SOURCE[0]}"
  while [ -h "$SOURCE" ]; do
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
  done
  echo "$( cd -P "$( dirname "$SOURCE" )" && pwd )"
}

Installer_dir="$(Installer_get_current_dir)"

# move to installler directory
cd "$Installer_dir"
source utils.sh

# Go back to module root
cd ..

echo
# check version in package.json file
Installer_version="$(grep -Eo '\"version\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"
Installer_module="$(grep -Eo '\"name\"[^,]*' ./package.json | grep -Eo '[^:]*$' | awk  -F'\"' '{print $2}')"

# Let's start !
Installer_info "② ➤ Preinstall"

echo

# Check not run as root
Installer_info "No root checking..."
if [ "$EUID" -eq 0 ]; then
  Installer_error "npm install must not be used as root"
  exit 255
fi
Installer_chk "$(pwd)/" "$Installer_module"
Installer_chk "$(pwd)/../../" "MagicMirror"
echo

# apply @sdetweil fix
Installer_info "Installing @sdetweil sandbox fix..."
bash -c "$(curl -sL https://raw.githubusercontent.com/sdetweil/MagicMirror_scripts/master/fixsandbox)"
echo

Installer_info "③ ➤ Install npm dependencies"