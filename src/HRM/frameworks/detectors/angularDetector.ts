import { DetectionContext, DetectionResult, FrameworkCapability } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

export class AngularDetector extends FrameworkDetector {
  async detect(context: DetectionContext) {
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "@angular/core",
        weight: 0.4,
        matched: this.hasRuntimeDependency(context, "@angular/core"),
      },
      {
        type: "dev_tool",
        pattern: "@angular/cli",
        weight: 0.1,
        matched: this.hasDevDependency(context, "@angular/cli"),
      },
      {
        type: "file_pattern",
        pattern: "angular.json",
        weight: 0.15,
        matched: this.hasFileContaining(context, /angular\.json$/i),
      },
      {
        type: "file_pattern",
        pattern: ".component.ts files",
        weight: 0.15,
        matched: this.hasFileContaining(context, /\.component\.ts$/i),
      },
      {
        type: "code_pattern",
        pattern: "angular_component",
        weight: 0.1,
        matched: this.hasCodePattern(context, "angular_component"),
      },
    ];

    const confidence = this.calculateConfidence(indicators);
    if (confidence < 0.35) {
      return null;
    }

    const version = this.getVersion(context, "@angular/core");
    const capabilities: FrameworkCapability[] = [
      {
        category: "ui",
        features: ["components", "templates", "directives", "pipes"],
        patterns: [
          {
            name: "Component Architecture",
            description: "Build applications with Angular's component-based architecture.",
            guidance: "Use standalone components in Angular 14+ for simpler module structure. Leverage signals for reactive state in Angular 16+.",
            examples: [
              `@Component({\n  selector: 'app-user',\n  standalone: true,\n  template: \`<div>{{ user.name }}</div>\`,\n  imports: [CommonModule]\n})\nexport class UserComponent {\n  user = signal({ name: 'Alice', age: 30 });\n}`,
            ],
          },
          {
            name: "Template Syntax",
            description: "Use Angular's powerful template syntax for data binding and directives.",
            guidance: "Leverage structural directives (*ngIf, *ngFor), property binding [property], event binding (event), and two-way binding [(ngModel)].",
            examples: [
              `<div *ngIf="isVisible">\n  <ul>\n    <li *ngFor="let item of items">{{ item.name }}</li>\n  </ul>\n  <button (click)="handleClick()">Click</button>\n</div>`,
            ],
          },
        ],
      },
      {
        category: "backend",
        features: ["services", "providers", "inject_function", "dependency_injection"],
        patterns: [
          {
            name: "Dependency Injection",
            description: "Use Angular's DI system for service injection and modularity.",
            guidance: "Prefer inject() function in Angular 14+ over constructor injection. Use providedIn: 'root' for singleton services.",
            examples: [
              `@Injectable({ providedIn: 'root' })\nexport class UserService {\n  private http = inject(HttpClient);\n  \n  getUsers() {\n    return this.http.get<User[]>('/api/users');\n  }\n}`,
              `// Component using inject()\nexport class UserComponent {\n  private userService = inject(UserService);\n  users = this.userService.getUsers();\n}`,
            ],
          },
          {
            name: "RxJS Observables",
            description: "Handle asynchronous operations with RxJS observables and operators.",
            guidance: "Use operators like map, filter, switchMap for data transformations. Remember to unsubscribe or use async pipe.",
            examples: [
              `users$ = this.http.get<User[]>('/api/users').pipe(\n  map(users => users.filter(u => u.active)),\n  catchError(error => {\n    console.error(error);\n    return of([]);\n  })\n);`,
              `// In template with async pipe\n<div *ngFor="let user of users$ | async">\n  {{ user.name }}\n</div>`,
            ],
          },
          {
            name: "Signals (Angular 16+)",
            description: "Use signals for fine-grained reactivity without zone.js overhead.",
            guidance: "Signals provide better performance than observables for local state. Use computed() for derived state.",
            examples: [
              `count = signal(0);\ndoubled = computed(() => this.count() * 2);\n\nincrement() {\n  this.count.update(c => c + 1);\n}`,
            ],
          },
        ],
      },
      {
        category: "routing",
        features: ["router", "lazy_loading", "guards"],
        patterns: [
          {
            name: "Angular Router",
            description: "Implement client-side routing with lazy loading and route guards.",
            guidance: "Use loadComponent for lazy loading standalone components. Implement guards as functions (Angular 14+).",
            examples: [
              `const routes: Routes = [\n  {\n    path: 'admin',\n    loadComponent: () => import('./admin/admin.component'),\n    canActivate: [authGuard]\n  }\n];`,
            ],
          },
          {
            name: "Reactive Forms",
            description: "Build type-safe forms with reactive forms API.",
            guidance: "Use FormBuilder or FormControl/FormGroup directly. Leverage typed forms in Angular 14+.",
            examples: [
              `userForm = new FormGroup({\n  name: new FormControl('', [Validators.required]),\n  email: new FormControl('', [Validators.required, Validators.email])\n});`,
            ],
          },
        ],
      },
      {
        category: "testing",
        features: ["jasmine", "karma", "testbed"],
        patterns: [
          {
            name: "Component Testing",
            description: "Test components with TestBed and fixture APIs.",
            guidance: "Use TestBed.configureTestingModule for component testing. Access component instance and DOM via fixture.",
            examples: [
              `TestBed.configureTestingModule({\n  imports: [UserComponent]\n});\nconst fixture = TestBed.createComponent(UserComponent);\nconst component = fixture.componentInstance;`,
            ],
          },
        ],
      },
    ];

    return this.buildSignature("Angular", version, indicators, capabilities);
  }

  private hasFileContaining(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => pattern.test(node.path));
  }

  private hasCodePattern(context: DetectionContext, identifier: string): boolean {
    return context.codePatterns.some((pattern) => pattern.identifier === identifier);
  }

  private getVersion(context: DetectionContext, dependency: string): string | undefined {
    return this.getRuntimeDependencyVersion(context, dependency);
  }
}
