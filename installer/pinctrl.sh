#!/bin/bash
# +-------------------+
# | pinctrl installer |
# +-------------------+

dependencies=(cmake device-tree-compiler libfdt-dev)

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

# Go back to user home
cd ~

# Let's start !
Installer_info "① ➤ Install pinctrl dependencies"
if [[ -n $dependencies ]]; then
  Installer_info "Checking all dependencies..."
  Installer_update_dependencies || exit 255
  Installer_success "All Dependencies needed are installed !"
fi

echo

Installer_info "② ➤ Clone utils repository"
git clone https://github.com/raspberrypi/utils || {
  Installer_error "git clone error"
  exit 255
}

echo

Installer_info "③ ➤ Install pinctrl"
{
  cd utils/pinctrl
  cmake .
  make
  sudo make install
} || {
  Installer_error "Install error"
  exit 255
}

echo

Installer_success "pinctrl is now installed !"