#!/bin/bash
# +---------+
# | Rebuild |
# +---------+

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

Installer_info "Welcome to EXT-Screen rebuild script"
Installer_warning "This script will erase current EXT-Screen build and reinstall it"
Installer_error "Use this script only for the new version of Magic Mirror or developer request"
Installer_yesno "Do you want to continue ?" || exit 0

echo
Installer_info "Deleting: package-lock.json node_modules" 
rm -rf package-lock.json node_modules
Installer_success "Done."

echo
Installer_info "Upgrading EXT-Screen..."
git reset --hard HEAD
git pull
Installer_success "Done."

Installer_info "Reinstalling EXT-Screen..."
npm install
