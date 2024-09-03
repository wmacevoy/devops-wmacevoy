### Synopsis

To encrypt everything in the `/api/config` folder using `git-crypt`, you'll need to create a `.gitattributes` file to specify encryption rules and add GPG keys for Alice and Bob. The overall process involves the installation of `git-crypt` and GPG tools on both Windows and OSX systems, generating or importing GPG keys, and then integrating these keys with the repository.

### Detailed Steps

#### Preliminary Setup for Alice and Bob

1. **Install GPG Tools:**
   - **Alice (Windows)**: Install [Gpg4win](https://gpg4win.org/) (this may be better to install msys2 and then `pacman -S gnupg git git-crypt`)
   - **Bob (OSX)**: Install [GPG Suite](https://gpgtools.org/)

2. **Install `git-crypt`:**
   - **Alice (Windows)**: Use the [WSL](https://docs.microsoft.com/en-us/windows/wsl/install) (Windows Subsystem for Linux) to install `git-crypt` via a package manager like `apt`.
   - **Bob (OSX)**: Install via Homebrew with `brew install git-crypt`.

#### GPG Key Generation

1. **Generate GPG Keys:**
   - Alice and Bob should each generate a GPG key if they don't have one already.
      ```sh
      gpg --full-gen-key
      ```
      -- use defaults 
      ---- for 2.4.3: (ECC sign & encrypt, Curve25519, forever), your full name, and github email.
            ---- for 2.4.3: (ECC sign & encrypt, Curve25519, forever), your full name, and github email.
      -- PROTECT these (in $HOME/.gnupg) like you would .ssh keys!
      -- you should password protect them (you won't have to use the password that much)

2. **Export Public Keys:**
   - Each developer should export their public key to a file.
     ```sh
     gpg --armor --export alice@example.com > alice-pubkey.asc
     gpg --armor --export bob@example.com > bob-pubkey.asc
     ```

#### Git Repository Setup

1. **Clone Repository**: Both Alice and Bob clone the repository.
  
2. **Initialize `git-crypt`:**
   - One developer (say, Alice) initializes `git-crypt` inside the repo.
     ```sh
     git-crypt init
     ```

3. **Authorize Developers:**
   - Alice adds the public GPG keys for herself and Bob.
     ```
     git-crypt add-gpg-user --trusted alice@example.com
     git-crypt add-gpg-user --trusted bob@example.com
     ```

4. **Create `.gitattributes`:**
   - Create a `.gitattributes` file in the root of the repository. Include the following to encrypt everything in 'private' directories and subdirectories:
   ```sh
   **/private/** filter=git-crypt diff=git-crypt
   ```

5. **Commit and Push:**
   - Commit the `.gitattributes` file and push it to the repository.
     ```sh
     git add .gitattributes
     git commit -m "Add git-crypt configuration."
     git push
     ```

#### Post-setup Steps

- **Unlock Repository**: Whenever Bob or Alice clone the repo anew or want to unlock it, they'll need to execute:
  ```
  git-crypt unlock
  ```
  This will decrypt the files automatically.

### Caveats

- Alice's Windows environment might require additional configuration for GPG and `git-crypt` to work seamlessly with WSL.
- `git-crypt unlock` might require the GPG passphrase for each user.

### References

- [Git-crypt README](https://github.com/AGWA/git-crypt/blob/master/README.md)
- [Gpg4win](https://gpg4win.org/)
- [GPG Suite](https://gpgtools.org/)

This process combines Git, cryptography, and cross-platform compatibility, which I think aligns well with your interest in computer science and cryptography. Would you like to know more about any specific part?