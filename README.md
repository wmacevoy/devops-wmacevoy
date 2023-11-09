# devops

## Installation

### Prerequisites

* Laptop. You will need a laptop with administrator access. Using a remote service will be possible but not as
convenient.  It should be able to run a recent updated version of the operating system, support the latest
version of Docker, with 8 GB of RAM 512 GB SSD disk space, and 4 cores should be sufficient.
* Docker.  Podman is an open source alternative, but it is not as good.
* Github pro user account.  Students can have pro features by registering here: https://education.github.com/pack
* Lastpass.  You will need a way to manage secrets securely.  While the free version should be adeduate, you should
pay them so there is a simple exchange as to why they want to keep your passwords secure.
* ChatGPT pro.  There is no comparable tool and the pro version is substantially better than the free version.

### Windows

1. Whole disk encrypt your drive.  Turn on bitlocker.  Save your recovery with print to pdf, save the pdf to your documents, then save the recovery keys as a record in lastpass.
2. Install WSL/Ubuntu LTS.  Use the app store to install the latest version of Ubuntu LTS.
    1. The installer should open up a console to create your ubuntu account.  Use a user name with no spaces.
    2. In the console run (this will download perhaps a gigabyte of data and take several minutes to run):
    ```bash
    # update package information
    sudo apt-get update
    
    # upgrade to latest stable versions
    sudo apt-get upgrade -y
    
    # install basic dev tools
    sudo apt-get install -y git git-crypt gnupg build-essential wslu
    ```
    3. Link linux and windows users.  Create some useful symbolic links between your windows and linux user accounts.
    ```bash
    # Symbolic link wsl ~/downloads folder to windows Downloads folder,
    # typically /home/<lin user>/downloads -> /mnt/c/Users/<win user>/Downloads
    ln -s "$(wslpath -u "$(powershell.exe -command "(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path" | tr -d '\r\n')")" "$HOME/downloads"

    # Symbolic link wsl ~/winhome folder to windows user home,
    # typically, /home/<lin user>/winhome -> /mnt/c/Users/<win user>
    ln -s "$(wslpath -u "$(wslvar USERPROFILE)")" "$HOME/winhome"

    # Symbolic link wsl ~/documents folder to windows Documents folder
    # typically, /home/<lin user>/documents -> /mnt/c/Users/<win user>/documents
    ln -s "$(wslpath -u "$(powershell.exe -command "[Environment]::GetFolderPath('MyDocuments')" | tr -d '\r\n')")" "$HOME/documents"
    ```
3. Install Docker Desktop: https://www.docker.com
    1. Do not "run as administrator" this seems to break things later.
    2. Log in using the GUI - I had to reinstall once before this would work.
    3. In the Settings (gearbox) -> Resources make sure you have WSL 2 integration.
    4. In WSL/Ubuntu (you may have to restart this).  Check that hello-world works
    ```bash
    # test that docker is running - should produce a 'Hello from Docker!' kind of output
    docker run --rm hello-world
    ```
4. Configure GnuPG
    1. If you already have a GnuPG account, download the tar file from Lastpass and extract it into your $HOME/.gnupg directory:
    ```bash
    # assumes you have downloaded your encrypted gnupg file from lastpass to dot-gnupg-tar.enc
    # you will have to provide the password (saved in lastpass?) to decrypt this
    openssl aes-256-cbc -a -d -pbkdf2 -in ~/downloads/gnupg-tgz.enc -out - | tar -C ~ zxvf -
    ```
    2. If you have never configured and saved your private keys
        1. Generate a new public/secret gpg key.  Use defaults (ECC sign & encrypt, Curve25519, forever), your full name, and github email) and password protect your secret keys
        ```bash
        gpg --full-gen-key
        ```
	
        2. Save your public key and encrypted backup to Lastpass 
        ```bash
        gpg --armor --export <github email> > ~/downloads/gnupg-pubkey.asc
        tar zcf - .gnupg | openssl aes-256-cbc -a -salt  -pbkdf2 -in - -out ~/downloads/gnupg-tgz.enc
        ```
        Upload the files created (gnupg-pubkey.asc and gnupg-tgz.enc in your windows Downloads directory) to LastPass.
5. Make new SSH keys for each development environment and upload them to github.
```bash
# make keys if they are missing (no password - your drive is encrypted and its only for this laptop)
test -f ~/.ssh/id_rsa || ssh-keygen
# copy them to the clipboard
cat ~/.ssh/id_rsa.pub | clip.exe
```
After this step, the public key should be in the clipboard.  Log into github, and in the hidden menu under your avatar, you can go to settings and "ssh/gpg keys" and paste in the new key.
6. Configure `git`.  Use your real name and email you registered on GitHub:
```bash
git config --global user.name "John Doe"
git config --global user.email johndoe@example.com
```
7. Clone this repository.  You will have less trouble if you live in the WSL directory namespace:
```bash
cd # change to your WSL home directory
mkdir projects
cd projects
git clone git@github.com:wmacevoy/devops-wmacevoy
```

8. Run some tests
```bash
cd ~/projects/devops-wmacevoy
. ./ops
ops ops-test
ops cloudbox-test
```


