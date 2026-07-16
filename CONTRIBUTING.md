# Contributing to Results Portal

We welcome contributions to the Results Portal! Whether you are fixing bugs, improving documentation, or adding new features, your help is appreciated.

## Getting Started

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Clone the Fork**: Clone it locally.
3. **Set Up the Environment**: Follow the installation steps in the [README](README.md).
4. **Create a Branch**: Create a feature branch for your changes (`git checkout -b feature/my-new-feature`).

## Guidelines

- **Code Quality**: Write clean, modern, and readable code. Avoid introducing complex third-party dependencies unless necessary.
- **Privacy First**: Ensure zero real student credentials or actual dataset lines are committed to public directories. Always test using the synthetic dataset inside `data/dummy_dataset.csv`.
- **Testing**: Run the local compiler server and verify the static page builds (`npm run build`) finish without compilation or rendering failures.
- **Documentation**: Update the README or create appropriate documentation files if you change configurations or build steps.

## Submitting Pull Requests

1. Commit your changes and push to your fork.
2. Open a Pull Request (PR) against the `main` branch of this repository.
3. Describe the change clearly, including how it was tested.
