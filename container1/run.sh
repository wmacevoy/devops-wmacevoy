#!/bin/bash

local SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd "$SCRIPT_DIR" || exit 1

if [ ! -f "Dockerfile" ]
then
    echo "'$SCRIPT_DIR' does not contain a Dockerfile."
    exit 1
fi

if which podman > /dev/null
then
    container=podman
else
    container=docker
fi

args=()

while [ $# -gt 0 ]
do
    case "$1"
    in
	--podman)  container=podman;;
	--docker)  container=docker;;
	*) args+=("$1");;
    esac
    shift
done

if ! which $container > /dev/null
then
    echo "No '$container' command found."
    exit 1
fi

is_windows() {
    if which cygpath > /dev/null # git-bash/msys/cygwin
    then
    	return 0
    fi
    if [ -r /proc/version ] && grep -q Microsoft /proc/version
    then
	    return 0
    fi
    return 1
}

# SELinux needs :Z option for podman
is_selinux() {
    if which sestatus > /dev/null
    then
	if sestatus | grep -q enabled
	then
	    return 0
	fi
    fi
    return 1
}

optZ() {
    if [ "$container" = "podman" ]
    then
        if is_selinux
        then
            echo -n ":Z"
        fi
    fi
}

winenv() {
  if is_windows
  then
      winpty "$@"
  else
      "$@"
  fi
}

# Try to convert for git-bash/msys/cygwin/wsl...
winpath() {
    if which cygpath > /dev/null # git-bash/msys/cygwin
    then
       cygpath -w "$@"
    elif [ -r /proc/version ] && grep -q Microsoft /proc/version
    then
	echo readlink -m "$@" | sed 's|^/mnt/\([a-z]\)|\U\1:|' | sed 's|/|\\|g'
    else
	echo "$@"
    fi
}

# use the directory name as the tag name for podman
CONTAINER_TAG=$container-$(basename "$SCRIPT_DIR")

# Host (source) directory to mount in container
HOST_DIR="$(winpath "$SCRIPT_DIR")"

# Guest (target) directory where host directoy is mounted
GUEST_DIR=/app

if [ ! -f "Dockerfile" ]
then
    echo "'$SCRIPT_DIR' does not contain a Dockerfile."
    exit 1
fi

echo "$container build '$SCRIPT_DIR/Dockerfile' with tag '$CONTAINER_TAG'..."
if $container build -t "$CONTAINER_TAG" "$SCRIPT_DIR"
then
    echo "$container build ok."
else
    echo "$container build failed."
    exit 1
fi

if [ ${#args[@]} -eq 0 ]
then
    args=("bash" "-c" "cd $GUEST_DIR; bash -i")
fi

winenv $container run -it --rm \
       -v "$HOST_DIR:$GUEST_DIR$(optZ)" \
       -h ubuntu \
       -p 8080:8080 \
       "$CONTAINER_TAG" \
       "${args[@]}"
