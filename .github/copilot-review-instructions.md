# GitHub Copilot Code Review Instructions

## Review Focus Areas

### 1. Code Quality
- **Readability**: Code should be clear and self-documenting
- **Maintainability**: Easy to modify and extend
- **Consistency**: Follow established patterns and conventions
- **Simplicity**: Prefer simple solutions over complex ones

### 2. Security
- **Input validation**: Check for proper sanitization
- **Authentication/Authorization**: Verify access controls
- **Data exposure**: Ensure sensitive data isn't leaked
- **Dependencies**: Check for vulnerable packages

### 3. Performance
- **Efficiency**: Look for unnecessary computations or loops
- **Memory usage**: Watch for memory leaks or excessive allocation
- **Database queries**: Check for N+1 problems and optimization opportunities
- **Caching**: Identify opportunities for caching

### 4. Best Practices
- **Error handling**: Proper try-catch blocks and error messages
- **Logging**: Appropriate logging levels and messages
- **Testing**: Adequate test coverage for new functionality
- **Documentation**: Code comments and README updates

### 5. Architecture
- **Separation of concerns**: Single responsibility principle
- **DRY principle**: Don't repeat yourself
- **SOLID principles**: Follow object-oriented design principles
- **Design patterns**: Appropriate use of established patterns

## Review Checklist

### Before Reviewing
- [ ] Understand the purpose and context of the changes
- [ ] Check if tests are included and passing
- [ ] Verify the PR description is clear and complete

### During Review
- [ ] Code follows project conventions and style guide
- [ ] No obvious bugs or logical errors
- [ ] Security considerations are addressed
- [ ] Performance implications are considered
- [ ] Error handling is appropriate
- [ ] Code is well-documented where necessary

### Language-Specific Checks

#### JavaScript/TypeScript
- [ ] Proper type definitions (TypeScript)
- [ ] No unused variables or imports
- [ ] Proper async/await usage
- [ ] Event listener cleanup

#### Python
- [ ] PEP 8 compliance
- [ ] Proper exception handling
- [ ] Type hints where appropriate
- [ ] Memory-efficient data structures

#### General
- [ ] No hardcoded secrets or configurations
- [ ] Proper resource cleanup (files, connections)
- [ ] Thread safety considerations
- [ ] Cross-platform compatibility

## Feedback Guidelines

### Constructive Comments
- Be specific about the issue
- Suggest improvements, not just problems
- Explain the reasoning behind suggestions
- Prioritize feedback (critical vs. minor)

### Tone
- Be respectful and professional
- Focus on the code, not the person
- Ask questions to understand intent
- Acknowledge good practices when you see them

## Example Comments

### Good Examples
```
💡 Consider using a Map instead of an object here for better performance with frequent lookups.

🔒 This endpoint should validate user permissions before processing the request.

📚 Could you add a comment explaining the purpose of this complex regex pattern?

✅ Great use of early returns to reduce nesting!
```

### Avoid
```
❌ This is wrong.
❌ Bad code.
❌ Why did you do this?
```
