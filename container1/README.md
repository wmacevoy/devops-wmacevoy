# Single container

This is a tiny example of a node server (hello world on port 3000)

To build

```bash
<docker or podman> build --tag <tagname> .
```

To run

```bash
<docker or podman> run -p 3000:3000 <tagname>
```

The `run.sh` command builds & runs the container with a tag name of the directory in which it resides.
