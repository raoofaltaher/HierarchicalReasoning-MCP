/**
 * Angular Framework Specialist
 * Provides Angular-specific reasoning patterns for the Hierarchical Reasoning system.
 * Focuses on dependency injection, RxJS, signals, and modern Angular patterns (14+).
 */

export interface AngularReasoningContext {
  /** Component type: standalone or module-based */
  componentType?: "standalone" | "module_based";
  /** Dependency injection style */
  diStyle?: "constructor" | "inject_function";
  /** State management approach */
  stateManagement?: "signals" | "observables" | "services" | "ngrx";
  /** Forms approach */
  formsAPI?: "reactive" | "template_driven";
  /** Testing framework */
  testingFramework?: "jasmine" | "jest" | "karma";
  /** Angular version */
  version?: string;
  /** TypeScript usage */
  typeScript?: boolean;
}

export interface AngularReasoningResult {
  framework: "angular";
  problemCategory: string;
  reasoning: string[];
  patterns: ReasoningPattern[];
  recommendations: string[];
  codeExamples: string[];
}

export interface ReasoningPattern {
  name: string;
  description: string;
  guidance: string;
  examples: string[];
}

const PATTERNS: ReasoningPattern[] = [
  {
    name: "Standalone Components",
    description: "Use Angular 14+ standalone components for simplified architecture.",
    guidance:
      "Standalone components eliminate the need for NgModules in most cases. Import dependencies directly in the component metadata. Use for new projects or gradual migration.",
    examples: [
      `// Standalone component with imports\n@Component({\n  selector: 'app-user-list',\n  standalone: true,\n  imports: [CommonModule, RouterModule, UserCardComponent],\n  template: \`\n    <div *ngFor="let user of users()">\n      <app-user-card [user]="user" />\n    </div>\n  \`\n})\nexport class UserListComponent {\n  users = signal<User[]>([]);\n}`,
      `// Bootstrap standalone application\nimport { bootstrapApplication } from '@angular/platform-browser';\nimport { provideRouter } from '@angular/router';\nimport { AppComponent } from './app/app.component';\nimport { routes } from './app/app.routes';\n\nbootstrapApplication(AppComponent, {\n  providers: [\n    provideRouter(routes),\n    provideHttpClient()\n  ]\n});`,
    ],
  },
  {
    name: "Modern Dependency Injection",
    description: "Use inject() function for cleaner, more composable dependency injection.",
    guidance:
      "The inject() function (Angular 14+) allows dependency injection outside constructors, enabling better code organization and functional patterns. Works in components, directives, pipes, and services.",
    examples: [
      `// Service with inject()\n@Injectable({ providedIn: 'root' })\nexport class UserService {\n  private http = inject(HttpClient);\n  private router = inject(Router);\n  \n  async loadUser(id: string): Promise<User> {\n    const user = await firstValueFrom(\n      this.http.get<User>(\`/api/users/\${id}\`)\n    );\n    return user;\n  }\n}`,
      `// Component with inject()\nexport class UserProfileComponent {\n  private route = inject(ActivatedRoute);\n  private userService = inject(UserService);\n  \n  userId = toSignal(this.route.params.pipe(\n    map(params => params['id'])\n  ));\n  \n  user = toSignal(toObservable(this.userId).pipe(\n    switchMap(id => id ? this.userService.loadUser(id) : of(null))\n  ));\n}`,
      `// Functional injection in helper\nexport function injectQueryParams() {\n  const route = inject(ActivatedRoute);\n  return toSignal(route.queryParams);\n}\n\n// Use in component\nexport class SearchComponent {\n  queryParams = injectQueryParams();\n}`,
    ],
  },
  {
    name: "Signals for Reactive State",
    description: "Leverage Angular 16+ signals for fine-grained reactivity and better performance.",
    guidance:
      "Signals provide reactive primitives without Zone.js overhead. Use signal() for state, computed() for derived values, and effect() for side effects. Signals integrate seamlessly with templates.",
    examples: [
      `// Basic signals\nexport class CounterComponent {\n  count = signal(0);\n  doubled = computed(() => this.count() * 2);\n  \n  increment() {\n    this.count.update(c => c + 1);\n  }\n  \n  reset() {\n    this.count.set(0);\n  }\n}`,
      `// Signals with arrays and objects\nexport class TodoListComponent {\n  todos = signal<Todo[]>([]);\n  filter = signal<'all' | 'active' | 'completed'>('all');\n  \n  filteredTodos = computed(() => {\n    const filter = this.filter();\n    const todos = this.todos();\n    \n    if (filter === 'active') return todos.filter(t => !t.completed);\n    if (filter === 'completed') return todos.filter(t => t.completed);\n    return todos;\n  });\n  \n  addTodo(text: string) {\n    this.todos.update(todos => [\n      ...todos,\n      { id: Date.now(), text, completed: false }\n    ]);\n  }\n  \n  toggleTodo(id: number) {\n    this.todos.update(todos =>\n      todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)\n    );\n  }\n}`,
      `// Effects for side effects\nexport class UserPreferencesComponent {\n  theme = signal<'light' | 'dark'>('light');\n  \n  constructor() {\n    // Save to localStorage when theme changes\n    effect(() => {\n      localStorage.setItem('theme', this.theme());\n      document.body.className = this.theme();\n    });\n  }\n}`,
    ],
  },
  {
    name: "RxJS Patterns",
    description: "Use RxJS observables and operators for complex asynchronous operations.",
    guidance:
      "RxJS excels at complex data flows, HTTP requests, and event handling. Use async pipe in templates to auto-subscribe/unsubscribe. Leverage operators like switchMap, debounceTime, distinctUntilChanged.",
    examples: [
      `// Search with debounce\nexport class SearchComponent {\n  searchControl = new FormControl('');\n  \n  results$ = this.searchControl.valueChanges.pipe(\n    debounceTime(300),\n    distinctUntilChanged(),\n    switchMap(query => \n      query ? this.searchService.search(query) : of([])\n    ),\n    catchError(error => {\n      console.error('Search failed:', error);\n      return of([]);\n    })\n  );\n}\n\n// Template\n<input [formControl]="searchControl" placeholder="Search...">\n<div *ngFor="let result of results$ | async">\n  {{ result.name }}\n</div>`,
      `// Combine multiple observables\nexport class DashboardComponent {\n  private http = inject(HttpClient);\n  \n  dashboardData$ = combineLatest([\n    this.http.get<User>('/api/user'),\n    this.http.get<Stats>('/api/stats'),\n    this.http.get<Notification[]>('/api/notifications')\n  ]).pipe(\n    map(([user, stats, notifications]) => ({\n      user,\n      stats,\n      notifications\n    })),\n    shareReplay(1)\n  );\n}`,
    ],
  },
  {
    name: "Reactive Forms",
    description: "Build type-safe, reactive forms with validation.",
    guidance:
      "Reactive forms provide programmatic control and type safety (Angular 14+). Use FormGroup, FormControl, and validators. Leverage typed forms for better IDE support.",
    examples: [
      `// Typed reactive form\ninterface UserForm {\n  name: string;\n  email: string;\n  age: number;\n}\n\nexport class UserFormComponent {\n  form = new FormGroup<FormControlsOf<UserForm>>({\n    name: new FormControl('', { \n      nonNullable: true, \n      validators: [Validators.required, Validators.minLength(2)] \n    }),\n    email: new FormControl('', {\n      nonNullable: true,\n      validators: [Validators.required, Validators.email]\n    }),\n    age: new FormControl(0, {\n      nonNullable: true,\n      validators: [Validators.required, Validators.min(18)]\n    })\n  });\n  \n  onSubmit() {\n    if (this.form.valid) {\n      const value = this.form.getRawValue(); // Typed as UserForm\n      this.userService.save(value);\n    }\n  }\n}`,
      `// Custom validators\nfunction ageRangeValidator(min: number, max: number): ValidatorFn {\n  return (control: AbstractControl): ValidationErrors | null => {\n    const age = control.value;\n    if (age < min || age > max) {\n      return { ageRange: { min, max, actual: age } };\n    }\n    return null;\n  };\n}\n\n// Usage\nage: new FormControl(0, [ageRangeValidator(18, 120)])`,
    ],
  },
  {
    name: "Smart Routing",
    description: "Implement efficient routing with lazy loading and guards.",
    guidance:
      "Use functional guards (Angular 14+) and lazy loading for better code splitting. Leverage route resolvers for data fetching. Use typed routes for better IDE support.",
    examples: [
      `// Functional route guards\nexport const authGuard: CanActivateFn = (route, state) => {\n  const authService = inject(AuthService);\n  const router = inject(Router);\n  \n  if (authService.isAuthenticated()) {\n    return true;\n  }\n  \n  return router.createUrlTree(['/login'], {\n    queryParams: { returnUrl: state.url }\n  });\n};\n\n// Routes with lazy loading\nconst routes: Routes = [\n  {\n    path: 'admin',\n    loadComponent: () => import('./admin/admin.component'),\n    canActivate: [authGuard]\n  },\n  {\n    path: 'users/:id',\n    loadComponent: () => import('./user/user-detail.component'),\n    resolve: { user: userResolver }\n  }\n];`,
      `// Typed route params\nexport class UserDetailComponent {\n  private route = inject(ActivatedRoute);\n  \n  userId = toSignal(\n    this.route.params.pipe(map(params => params['id']))\n  );\n}`,
    ],
  },
];

const CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  components: [
    /component/i,
    /standalone/i,
    /module/i,
    /template/i,
    /directive/i,
  ],
  dependencyInjection: [
    /inject/i,
    /dependency.*injection/i,
    /di/i,
    /service/i,
    /provider/i,
  ],
  reactivity: [
    /signal/i,
    /reactive/i,
    /rxjs/i,
    /observable/i,
    /state/i,
  ],
  forms: [
    /form/i,
    /validation/i,
    /input/i,
    /reactive.*form/i,
  ],
  routing: [
    /rout/i,
    /navigation/i,
    /guard/i,
    /lazy.*load/i,
  ],
  testing: [
    /test/i,
    /testing/i,
    /jasmine/i,
    /karma/i,
    /testbed/i,
  ],
  performance: [
    /performance/i,
    /slow/i,
    /optimize/i,
    /bundle.*size/i,
    /lazy.*load/i,
  ],
};

export class AngularFrameworkSpecialist {
  async generateAngularSpecificReasoning(
    problem: string,
    context: AngularReasoningContext,
    codeContext?: string
  ): Promise<AngularReasoningResult> {
    const category = this.categorize(problem);
    const contextSummary = this.buildContextSummary(context);
    const selectedPatterns = this.selectPatterns(category, context);
    const recommendations = this.generateRecommendations(category, context);
    const examples = this.generateExamples(category);

    const reasoning: string[] = [
      `Analyzing Angular ${category} problem:`,
      `Context: ${contextSummary}`,
      `Recommended approach: ${selectedPatterns.map((p) => p.name).join(", ")}`,
    ];

    if (codeContext) {
      const codeAnalysis = this.generateCodeContextSummary(codeContext);
      reasoning.push(`Code analysis: ${codeAnalysis}`);
    }

    return {
      framework: "angular",
      problemCategory: category,
      reasoning,
      patterns: selectedPatterns,
      recommendations,
      codeExamples: examples,
    };
  }

  private categorize(problem: string): string {
    for (const [category, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
      if (patterns.some((regex) => regex.test(problem))) {
        return category;
      }
    }
    return "general";
  }

  private buildContextSummary(context: AngularReasoningContext): string {
    const parts: string[] = [];

    if (context.componentType) {
      parts.push(`${context.componentType} components`);
    }
    if (context.diStyle) {
      parts.push(`${context.diStyle} for DI`);
    }
    if (context.stateManagement) {
      parts.push(`${context.stateManagement} for state`);
    }
    if (context.formsAPI) {
      parts.push(`${context.formsAPI} forms`);
    }
    if (context.version) {
      parts.push(`Angular ${context.version}`);
    }

    return parts.length > 0 ? parts.join(", ") : "default Angular setup";
  }

  private selectPatterns(category: string, context: AngularReasoningContext): ReasoningPattern[] {
    const categoryPatternMap: Record<string, string[]> = {
      components: ["Standalone Components"],
      dependencyInjection: ["Modern Dependency Injection"],
      reactivity: ["Signals for Reactive State", "RxJS Patterns"],
      forms: ["Reactive Forms"],
      routing: ["Smart Routing"],
      performance: ["Standalone Components", "Smart Routing"],
    };

    const patternNames = categoryPatternMap[category] || ["Modern Dependency Injection"];
    return PATTERNS.filter((p) => patternNames.includes(p.name));
  }

  private generateRecommendations(category: string, context: AngularReasoningContext): string[] {
    const recommendations: string[] = [];

    // Category-specific recommendations
    if (category === "components") {
      recommendations.push(
        "Use standalone components for new Angular 14+ applications",
        "Import dependencies directly in component metadata",
        "Consider gradual migration from module-based to standalone"
      );
    } else if (category === "dependencyInjection") {
      recommendations.push(
        "Use inject() function instead of constructor injection for cleaner code",
        "Leverage providedIn: 'root' for singleton services",
        "Create functional injection helpers for reusable logic"
      );
    } else if (category === "reactivity") {
      if (context.version && parseInt(context.version) >= 16) {
        recommendations.push(
          "Use signals for local component state - better performance than observables",
          "Use computed() for derived state instead of manual calculations",
          "Use effect() sparingly - prefer computed() when possible"
        );
      }
      recommendations.push(
        "Use RxJS for complex async operations and HTTP requests",
        "Always use async pipe in templates to avoid manual subscription management",
        "Leverage operators like switchMap, debounceTime for better UX"
      );
    } else if (category === "forms") {
      recommendations.push(
        "Use reactive forms for complex forms with dynamic validation",
        "Leverage typed forms (Angular 14+) for type safety",
        "Create custom validators for business logic validation"
      );
    } else if (category === "routing") {
      recommendations.push(
        "Implement lazy loading for feature modules to reduce bundle size",
        "Use functional guards instead of class-based guards",
        "Leverage route resolvers for data fetching before component activation"
      );
    } else if (category === "performance") {
      recommendations.push(
        "Use OnPush change detection strategy for better performance",
        "Implement lazy loading for routes and components",
        "Use signals instead of observables for local state to avoid Zone.js overhead"
      );
    }

    // Context-based recommendations
    if (context.componentType === "module_based") {
      recommendations.push(
        "Consider migrating to standalone components for simpler architecture"
      );
    }

    if (context.diStyle === "constructor") {
      recommendations.push(
        "Consider using inject() function (Angular 14+) for better composability"
      );
    }

    if (context.stateManagement === "observables" && context.version && parseInt(context.version) >= 16) {
      recommendations.push(
        "Consider using signals for local state - better performance and simpler syntax"
      );
    }

    return recommendations;
  }

  private generateExamples(category: string): string[] {
    const pattern = PATTERNS.find((p) => {
      if (category === "components") return p.name === "Standalone Components";
      if (category === "dependencyInjection") return p.name === "Modern Dependency Injection";
      if (category === "reactivity") return p.name === "Signals for Reactive State";
      if (category === "forms") return p.name === "Reactive Forms";
      if (category === "routing") return p.name === "Smart Routing";
      if (category === "performance") return p.name === "Standalone Components";
      return false;
    });

    return pattern?.examples || PATTERNS[0].examples; // Default to Standalone Components
  }

  private generateCodeContextSummary(codeContext: string): string {
    const insights: string[] = [];

    if (/@Component.*standalone:\s*true/is.test(codeContext)) {
      insights.push("Using standalone components");
    } else if (/@NgModule/i.test(codeContext)) {
      insights.push("Using module-based architecture");
    }

    if (/\binject\(/i.test(codeContext)) {
      insights.push("Using inject() function");
    } else if (/constructor.*private/i.test(codeContext)) {
      insights.push("Using constructor injection");
    }

    if (/\bsignal\(/i.test(codeContext)) {
      insights.push("Using signals");
    }
    if (/\bcomputed\(/i.test(codeContext)) {
      insights.push("Using computed values");
    }
    if (/\beffect\(/i.test(codeContext)) {
      insights.push("Using effects");
    }

    if (/\.pipe\(/i.test(codeContext)) {
      insights.push("Using RxJS operators");
    }
    if (/async\s+pipe/i.test(codeContext)) {
      insights.push("Using async pipe in templates");
    }

    if (/FormGroup|FormControl/i.test(codeContext)) {
      insights.push("Using reactive forms");
    }

    if (/@Injectable/i.test(codeContext)) {
      insights.push("Service detected");
    }

    return insights.length > 0
      ? insights.join("; ")
      : "Standard Angular component structure";
  }
}
