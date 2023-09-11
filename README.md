# devops-wmacevoy

to run a container with the git openssl ssh gpg and git-crypt commands
```bash
docker build --file Dockerfile.sbox --tag sbox .
docker run -v "$HOME/.gitconfig:/root/.gitconfig" -v "$HOME/.ssh:/root/.ssh" -v "$HOME/.gnupg:/root/.gnupg" -v "$(pwd):/repo" --rm -it sbox bash -i
```
