# devops

## Installation

### Prerequisites

1. Laptop. You will need a laptop with administrator access. Using a remote service will be possible but not as
convenient.  It should be able to run a recent updated version of the operating system, support the latest
version of Docker, with 8 GB of RAM 512 GB SSD disk space, and 4 cores should be sufficient.
2. Docker.  Podman is an open source alternative, but it is not as good.
3. Github pro user account.  Students can have pro features by registering here: https://education.github.com/pack
4. Lastpass.  You will need a way to manage secrets securely.  While the free version should be adeduate, you should
pay them so there is a simple exchange as to why they want to keep your passwords secure.
5. ChatGPT pro.  There is no comparable tool and the pro version is substantially better than the free version.

### Windows

1. Whole disk encrypt your drive.  Turn on bitlocker.  Save your recovery with print to pdf, save the pdf to your documents, then save the recovery keys as a record in lastpass.

2. Install WSL/Ubuntu LTS.  Use the app store to install the latest version of Ubuntu LTS.
2.1 The installer should open up a console to create your ubuntu account.  Use a user name with no spaces.
2.2 In the console run (this will download perhaps a gigabyte of data and take several minutes to run):
```bash
# update package information
sudo apt-get update

# upgrade to latest stable versions
sudo apt-get upgrade -y

# install basic dev tools
sudo apt-get install -y git git-crypt gnupg build-essential wslu
```
2.3 Link linux and windows users.  Create some useful symbolic links between your windows and linux user accounts.  After this step, `~/WinHome` in WSL should be your windows home directory, and `~/Downloads` should be your downloads directory.
```bash
# Symbolic link wsl ~/Downloads folder to windows Downloads folder,
# typically /home/<lin user>/Downloads -> /mnt/c/Users/<win user>/Downloads
ln -s "$(wslpath -u "$(powershell.exe -command "(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path" | tr -d '\r\n')")" "$HOME/Downloads"


# Symbolic link wsl ~/WinHome folder to windows user home,
# typically, /home/<lin user>/WinHome -> /mnt/c/Users/<win user>
ln -s "$(wslpath -u "$(wslvar USERPROFILE)")" "$HOME/WinHome"

# Symbolic link wsl ~/Documents folder to windows Documents folder
# typically, /home/<lin user>/Documents -> /mnt/c/Users/<win user>/Documents
ln -s "$(wslpath -u "$(powershell.exe -command "[Environment]::GetFolderPath('MyDocuments')" | tr -d '\r\n')")" "$HOME/Documents"
```

3. Install Docker Desktop: https://www.docker.com
3.1 Do not "run as administrator" this seems to break things later.
3.2 Log in using the GUI - I had to reinstall once before this would work.
3.3 In the Settings (gearbox) -> Resources make sure you have WSL 2 integration.
3.4 In WSL/Ubuntu (you may have to restart this).  Check that hello-world works
```bash
# test that docker is running - should produce a 'Hello from Docker!' kind of output
docker run --rm hello-world
```

4. Configure GnuPG
4.1 If you already have a GnuPG account, download the tar file from Lastpass and extract it into your $HOME/.gnupg directory:
```bash
# assumes you have downloaded your encrypted gnupg file from lastpass to dot-gnupg-tar.enc
openssl aes-256-cbc -a -d -pbkdf2 -in ~/Downloads/gnupg-tgz.enc -out - | tar -C ~ zxvf -
```
4.2 If you have never configured and saved your private keys
4.2.1 Generate a new public/private gpg key
```bash
gpg --full-gen-key
```
-- use defaults 
---- for 2.4.3: (ECC sign & encrypt, Curve25519, forever), your full name, and github email.
      ---- for 2.4.3: (ECC sign & encrypt, Curve25519, forever), your full name, and github email.
-- PROTECT these (in $HOME/.gnupg) like you would .ssh keys!
-- you should password protect them (you won't have to use the password that much)
```
4.2.2 Save your public key and encrypted backup to Lastpass 
```bash
gpg --armor --export <github email> > ~/Downloads/gnupg-pubkey.asc
tar zcf - .gnupg | openssl aes-256-cbc -a -salt  -pbkdf2 -in - -out ~/Downloads/gnupg-tgz.enc
```
Upload the files created (gnupg-pubkey.asc and gnupg-tgz.enc in your windows Downloads directory) to LastPass.

5 Making new SSH keys for each development environment and upload them to github.
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

7. Clone this repository
