# devops-wmacevoy

to run a container with the git openssl ssh gpg and git-crypt commands
```bash
docker build --file Dockerfile.sbox --tag sbox .
docker run -v "$HOME/.gitconfig:/home/user/.gitconfig" -v "$HOME/.ssh:/home/user/.ssh" -v "$HOME/.gnupg:/home/user/.gnupg" -v "$(pwd):/repo" --rm -it sbox bash -i
```
