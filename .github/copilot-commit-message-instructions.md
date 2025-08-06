# GitHub Copilot Commit Message Instructions

## Commit Message Format
Use the conventional commit format with clear, descriptive messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

## Guidelines
1. **Keep the description concise** (50 characters or less)
2. **Use imperative mood** ("Add feature" not "Added feature")
3. **Capitalize the first letter** of the description
4. **No period at the end** of the description
5. **Include scope when relevant** (e.g., component, file, or feature area)

## Examples
```
feat(auth): add OAuth2 login functionality
fix(api): resolve timeout issue in user service
docs(readme): update installation instructions
refactor(utils): simplify date formatting logic
test(auth): add unit tests for login validation
```

## Body Guidelines (when needed)
- Explain **what** and **why**, not **how**
- Wrap at 72 characters
- Separate from subject with a blank line

## Footer Guidelines (when applicable)
- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`
- Co-authored commits: `Co-authored-by: Name <email>`
