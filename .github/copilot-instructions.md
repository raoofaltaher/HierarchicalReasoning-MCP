---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

# GitHub Copilot Project Instructions (Hierarchical Reasoning MCP)

> This file has been augmented with project-specific guidance for the Hierarchical Reasoning MCP (HRM) server. It combines general coding principles with the architecture, reasoning methodology, and roadmap unique to this repository.

## 0. Project Snapshot

| Aspect | Status |
|--------|--------|
| Core Reasoning Loop | Implemented (H/L cycles, auto mode) |
| Framework Detection | React, Next.js (basic), Express, Prisma, PostgreSQL (with placeholders for others) |
| Adaptive Metrics | Heuristic (density + diversity + candidate strength) |
| Plateau / Halting Logic | Implemented (confidence + convergence + plateau) |
| Semantic / Embeddings | Not yet (planned Medium/Long term) |
| Persistence | In-memory only (session map) |
| Tests | Not yet implemented |
| Docs | Being expanded (this file + plan update) |

## 1. Architecture Overview

The HRM server implements a hierarchical reasoning paradigm inspired by neuroscience and layered thinking frameworks.

Layers:
1. Protocol Layer (`index.ts`): MCP tool definition & request dispatch.
2. Orchestration (`engine.ts`): Auto reasoning loop, operation routing, framework enrichment.
3. Operations (`operations/*.ts`): Pure handlers for `h_plan`, `l_execute`, `h_update`, `evaluate`, `halt_check`.
4. State Management (`state.ts`): Session lifecycle, pruning, parameter reconciliation.
5. Metrics & Policy (`utils/metrics.ts`, `evaluation.ts`, `suggestions.ts`): Heuristic convergence & continuation logic.
6. Framework Intelligence (`frameworks/*`): Detection + specialist guidance injection.
7. Utility Layer (`utils/*.ts`): Text normalization, logging, context compaction.

Design Goals:
- Deterministic, side-effect-light core logic.
- Extensibility via detectors & specialists (Strategy pattern).
- Separation of reasoning state from transport logic.
- Safe auto mode (bounded iterations, plateau detection).

## 2. Reasoning Model Adaptation

| Concept | Implementation |
|---------|----------------|
| High-Level (H) | Strategic aggregation in `hContext` (planning & synthesis) |
| Low-Level (L) | Detail accumulation in `lContext` (task decomposition) |
| Multi-Cycle | `max_l_cycles_per_h` governs nested execution depth |
| Convergence | Heuristic composite score (coverage + diversity + candidates) |
| Halting | Confidence + convergence threshold OR plateau window |
| Auto Mode | Cyclic suggestion engine + safety cap (`MAX_AUTO_REASONING_STEPS`) |

Planned Enhancements (Medium+): semantic similarity, confidence decomposition, exploration mode.

## 3. Current Implementation Status vs Plan

| Phase | Elements | Status |
|-------|----------|--------|
| Phase 1 | Server scaffold, ops, state | Complete |
| Phase 2 | Cycle logic, convergence heuristics | Complete (heuristic only) |
| Phase 3 (partial) | Plateau detection, basic adaptive thresholds | Partial |
| Phase 3 (remaining) | Advanced stagnation heuristics, branching | Pending |
| Phase 4 | Tests, documentation polish | Not started |
| Phase 5+ | Embeddings, context-aware convergence, persistence | Not started |

## 4. Priority Improvement Roadmap

### Immediate (High Value / Low Effort)
1. Unit tests: metrics, suggestions, cycle progression, detectors.
2. Integration test: `auto_reason` with synthetic multi-framework workspace.
3. Generate tool schema automatically from Zod (eliminate duplication).
4. Session TTL eviction sweep (configurable inactivity timeout).
5. Enhanced halting rationale (explicit trigger annotation).
6. Duplicate low-level thought guard (hash last N entries).

### Short Term
7. Structured trace field (array) instead of embedding JSON string.
8. "Stack profile" summarizing combined framework signatures.
9. Boundary-aware keyword filters to reduce false framework triggers.
10. README section: hierarchical ops usage & examples.
11. Persistence adapter interface (pluggable backends; start with memory stub).

### Medium Term
12. Pluggable similarity scorer interface (embedding-ready).
13. Confidence decomposition (coverage, diversity, candidates, momentum components).
14. Exploration mode on early plateau (inject strategic variant prompts).
15. Metrics history & observability endpoint / tool.
16. Structured JSON logging toggle (env flag `HRM_LOG_FORMAT=json`).

### Long Term
17. Embedding service abstraction + semantic dedupe.
18. Versioned session export/import (collaboration & replay).
19. Pattern analytics registry (adoption feedback loop).
20. Domain-specific halting strategies (architecture vs debugging vs api design modes).

### Quick Wins (Candidate Next Patch Set)
- Add session eviction (TTL) in `SessionManager`.
- Add `trace` array to `HRMResponse` for `auto_reason`.
- Replace manual tool schema with generated JSON from Zod.

## 5. Coding Conventions (Supplemental Project-Specific)
- Prefer pure functions for metrics & suggestions to facilitate future model integration.
- Keep reasoning state mutations centralized in `SessionManager` and operation handlers.
- Any new detector must: (a) list indicators with weights, (b) specify minimum confidence threshold, (c) justify capability patterns.
- Expose internal scoring rationales when adding advanced convergence.

## 6. Testing Strategy (To Implement)
| Level | Focus | Notes |
|-------|-------|-------|
| Unit | metrics, suggestions, text normalization, detectors | Deterministic inputs/outputs |
| Integration | auto reasoning path, multi-framework enrichment | Use fixture workspace trees |
| Scenario | Architecture planning, debugging flow | Assert convergence + halting rationale presence |
| Future | Semantic similarity plug-in | Mock embedding provider |

Minimal test harness recommendation: Jest with isolated module state; dependency injection for future embedding service.

## 7. Observability & Telemetry (Planned)
- Structured logs (info events: operation, cycle indexes, metrics delta).
- Optional trace emission (structured array) for UI embedding.
- Potential metrics: time per cycle, average thought length, retention ratio.

## 8. Security & Safety Notes (Project Context)
- Framework detection operates only on local workspace path (no network I/O).
- Avoid embedding raw large file content directly into context—truncate via future semantic summarizer.
- Session IDs are UUIDs; do not accept caller-supplied IDs for cross-user sharing until auth model exists.

## 9. MCP / Sequential Thinking Alignment
- Mirrors Sequential Thinking MCP pattern of iterative tool operation but adds multi-level hierarchy and convergence gates.
- Suggestion pipeline analogous to tactical step selection with added plateau abort conditions.
- Future embedding integration should remain side-effect-free relative to protocol contract.

## 10. Contribution Guidance (Project-Specific)
PR Requirements:
1. Include or update tests where logic changes.
2. Update roadmap if introducing new medium/long-term feature surface.
3. Document new operations or response fields in README + this file.
4. Keep functions under ~80 lines; extract helpers early.

## 11. Decision Log (Recent)
| Decision | Date | Rationale |
|----------|------|-----------|
| Heuristic coverage metrics only (phase 2) | Current | Faster bootstrap; avoids premature embedding dependency |
| Plateau halting window = 3 | Current | Balances noise vs responsiveness |
| Confidence threshold default 0.8 | Current | Aligns with convergence heuristic and reduces premature halts |

## 12. Future Extensibility Hooks
- `SimilarityScorer` interface (to add).
- `PersistenceAdapter` with methods: `load(sessionId)`, `save(state)`, `evict(beforeTimestamp)`.
- `EmbeddingProvider` facade (OpenAI/local/huggingface).
- `HaltingStrategy` pluggable module per domain type.

---

The following sections retain the generalized Copilot guidelines and should continue to be honored.

## Core Principles

### 1. Code Quality Standards

- **Write clean, readable code** that follows established conventions
- **Prioritize maintainability** over cleverness
- **Use meaningful names** for variables, functions, and classes
- **Keep functions small** and focused on a single responsibility
- **Add comments** only when the code's intent isn't obvious
- **Follow the DRY principle** (Don't Repeat Yourself)

### 2. Best Practices

#### Security First
- Never hardcode sensitive information (API keys, passwords, tokens)
- Validate all user inputs and sanitize data
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Follow OWASP security guidelines

#### Performance Considerations
- Optimize for readability first, performance second
- Avoid premature optimization
- Use efficient algorithms and data structures when appropriate
- Consider memory usage and potential memory leaks
- Profile before optimizing

#### Error Handling
- Implement comprehensive error handling
- Use specific exception types
- Provide meaningful error messages
- Log errors appropriately
- Fail gracefully and provide fallback options

### 3. Language-Specific Guidelines

#### JavaScript/TypeScript
- Use TypeScript when possible for better type safety
- Prefer `const` and `let` over `var`
- Use async/await instead of callbacks or raw promises
- Implement proper error boundaries in React applications
- Use modern ES6+ features appropriately

```typescript
// Good
const fetchUserData = async (userId: string): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
```

#### Python
- Follow PEP 8 style guidelines
- Use type hints for better code documentation
- Prefer list comprehensions when they improve readability
- Use context managers for resource management
- Implement proper exception handling

```python
# Good
def process_user_data(user_id: str) -> Optional[User]:
    """Process user data with proper error handling."""
    try:
        with database_connection() as conn:
            user = conn.get_user(user_id)
            return validate_and_process(user)
    except UserNotFoundError:
        logger.warning(f"User {user_id} not found")
        return None
    except Exception as e:
        logger.error(f"Error processing user {user_id}: {e}")
        raise
```

#### React/Frontend
- Use functional components with hooks
- Implement proper state management
- Optimize re-renders with React.memo and useMemo
- Handle loading and error states
- Ensure accessibility (a11y) compliance

```tsx
// Good
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner aria-label="Loading user profile" />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <NotFoundMessage />;

  return <UserCard user={user} />;
};
```

### 4. Documentation Standards

#### Code Comments
- Explain **why**, not **what**
- Document complex business logic
- Include examples for public APIs
- Keep comments up-to-date with code changes

#### README Files
- Clear project description and purpose
- Installation and setup instructions
- Usage examples and API documentation
- Contributing guidelines
- License information

#### API Documentation
- Document all endpoints, parameters, and responses
- Include example requests and responses
- Specify error codes and handling
- Keep documentation in sync with implementation

### 5. Testing Philosophy

#### Test Coverage
- Aim for high test coverage (80%+) but focus on critical paths
- Write tests before fixing bugs (TDD approach)
- Include unit, integration, and end-to-end tests
- Mock external dependencies appropriately

#### Test Quality
- Tests should be independent and deterministic
- Use descriptive test names that explain the scenario
- Follow the AAA pattern (Arrange, Act, Assert)
- Test both happy paths and edge cases

```javascript
// Good test example
describe('UserService.createUser', () => {
  it('should create user with valid data and return user ID', async () => {
    // Arrange
    const userData = { name: 'John Doe', email: 'john@example.com' };
    const mockUserId = '12345';
    mockDatabase.insert.mockResolvedValue({ id: mockUserId });

    // Act
    const result = await userService.createUser(userData);

    // Assert
    expect(result.id).toBe(mockUserId);
    expect(mockDatabase.insert).toHaveBeenCalledWith(userData);
  });

  it('should throw validation error for invalid email', async () => {
    // Arrange
    const invalidUserData = { name: 'John', email: 'invalid-email' };

    // Act & Assert
    await expect(userService.createUser(invalidUserData))
      .rejects.toThrow('Invalid email format');
  });
});
```

### 6. Architecture Patterns

#### SOLID Principles
- **Single Responsibility**: Each class/function should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Don't force clients to depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

#### Design Patterns
- Use appropriate design patterns (Factory, Observer, Strategy, etc.)
- Avoid over-engineering with unnecessary patterns
- Prefer composition over inheritance
- Implement dependency injection for testability

### 7. Version Control

#### Commit Messages
- Use conventional commit format
- Keep commits atomic and focused
- Write clear, descriptive commit messages
- Include issue references when applicable

#### Branch Strategy
- Use feature branches for new development
- Keep branches short-lived and focused
- Use descriptive branch names
- Regularly rebase or merge from main branch

### 8. Deployment and DevOps

#### Environment Management
- Use environment variables for configuration
- Maintain separate configs for dev/staging/production
- Implement proper logging and monitoring
- Use CI/CD pipelines for automated deployments

#### Performance Monitoring
- Implement application performance monitoring (APM)
- Set up alerts for critical metrics
- Monitor database performance and query optimization
- Track user experience metrics

### 9. Accessibility and Inclusivity

#### Web Accessibility
- Follow WCAG 2.1 AA guidelines
- Use semantic HTML elements
- Provide alternative text for images
- Ensure keyboard navigation support
- Test with screen readers

#### Inclusive Design
- Consider diverse user needs and contexts
- Use inclusive language in code and documentation
- Design for different devices and connection speeds
- Consider internationalization (i18n) requirements

### 10. Communication Guidelines

#### Code Reviews
- Be constructive and respectful in feedback
- Explain the reasoning behind suggestions
- Ask questions to understand intent
- Acknowledge good practices and improvements

#### Documentation
- Write for your future self and team members
- Use clear, concise language
- Include relevant examples and use cases
- Keep documentation current with code changes

## Implementation Priorities

When suggesting code solutions, prioritize in this order:

1. **Correctness**: Code should work as intended
2. **Security**: Protect against vulnerabilities
3. **Readability**: Code should be easy to understand
4. **Maintainability**: Easy to modify and extend
5. **Performance**: Optimize when necessary
6. **Testability**: Design for easy testing

## Tools and Technologies

### Preferred Tools
- **Linting**: ESLint (JavaScript), Pylint (Python), etc.
- **Formatting**: Prettier, Black, etc.
- **Testing**: Jest, pytest, React Testing Library
- **Type Checking**: TypeScript, mypy
- **Documentation**: JSDoc, Sphinx, Swagger/OpenAPI

### Framework Preferences
- **Frontend**: React, Next.js, Vue.js
- **Backend**: Node.js/Express, Python/FastAPI, Python/Django
- **Database**: PostgreSQL, MongoDB (with proper justification)
- **State Management**: Redux Toolkit, Zustand, React Query

Remember: These are guidelines, not rigid rules. Always consider the specific context, team preferences, and project requirements when making decisions.

### Development Workflow

- When working on the `modelcontextprotocol/servers` repository:
    - Fork the repository.
    - Clone the forked repository to your local development environment: `git clone <your-forked-repo-url>`
    - Add the upstream remote:
      ```bash
      git remote add upstream https://github.com/modelcontextprotocol/servers.git
      git fetch upstream
      git pull upstream main
      ```
    - Create a new branch for your feature development: `git checkout -b <feature-branch-name>`
    - Develop within the `src/` directory following the project's architecture.
    - This approach ensures clean integration and easy upstream merging.