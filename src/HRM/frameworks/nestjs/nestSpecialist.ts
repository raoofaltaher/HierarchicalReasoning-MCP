/**
 * NestJS Framework Specialist
 * Provides NestJS-specific reasoning patterns for the Hierarchical Reasoning system.
 * Focuses on modules, dependency injection, controllers, providers, and modern backend patterns.
 */

export interface NestJSReasoningContext {
  /** Module architecture style */
  moduleArchitecture?: "feature_modules" | "monolithic" | "microservices";
  /** Dependency injection approach */
  dependencyInjection?: "constructor" | "property" | "custom_provider";
  /** API design style */
  apiStyle?: "rest" | "graphql" | "hybrid" | "grpc";
  /** ORM or database library */
  ormLibrary?: "typeorm" | "prisma" | "mongoose" | "sequelize" | "none";
  /** Testing framework */
  testingFramework?: "jest" | "vitest";
  /** NestJS version */
  version?: string;
  /** TypeScript strict mode */
  strictMode?: boolean;
}

export interface NestJSReasoningResult {
  framework: "nestjs";
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
    name: "Module Organization & Architecture",
    description: "Structure applications with feature modules, shared modules, and proper exports.",
    guidance:
      "Organize code by domain/feature into modules. Use shared modules for common utilities. Export providers that need to be available to other modules. Consider dynamic modules for configuration.",
    examples: [
      `// Feature module with proper organization\n@Module({\n  imports: [\n    TypeOrmModule.forFeature([Cat]),\n    SharedModule,\n  ],\n  controllers: [CatsController],\n  providers: [CatsService, CatsRepository],\n  exports: [CatsService] // Export for other modules\n})\nexport class CatsModule {}`,
      `// Shared module with @Global decorator\n@Global()\n@Module({\n  providers: [\n    ConfigService,\n    LoggerService,\n  ],\n  exports: [ConfigService, LoggerService]\n})\nexport class SharedModule {}`,
      `// Dynamic module for configuration\n@Module({})\nexport class DatabaseModule {\n  static forRoot(options: DatabaseOptions): DynamicModule {\n    return {\n      module: DatabaseModule,\n      providers: [\n        {\n          provide: 'DATABASE_OPTIONS',\n          useValue: options,\n        },\n        DatabaseService,\n      ],\n      exports: [DatabaseService],\n      global: true,\n    };\n  }\n}`,
      `// Microservices module\n@Module({\n  imports: [\n    ClientsModule.register([\n      {\n        name: 'USERS_SERVICE',\n        transport: Transport.TCP,\n        options: { host: 'localhost', port: 3001 }\n      }\n    ])\n  ],\n  controllers: [AppController],\n})\nexport class AppModule {}`,
    ],
  },
  {
    name: "Dependency Injection Patterns",
    description: "Master constructor injection, custom providers, and optional dependencies.",
    guidance:
      "Use constructor injection as the default. Mark classes with @Injectable(). Use custom providers (useClass, useValue, useFactory) for complex scenarios. Leverage @Inject() for custom tokens.",
    examples: [
      `// Standard constructor injection\n@Injectable()\nexport class CatsService {\n  constructor(\n    private readonly catsRepository: CatsRepository,\n    private readonly logger: LoggerService,\n  ) {}\n  \n  async findAll(): Promise<Cat[]> {\n    this.logger.log('Finding all cats');\n    return this.catsRepository.findAll();\n  }\n}`,
      `// Custom provider with useFactory\n{\n  provide: 'DATABASE_CONNECTION',\n  useFactory: async (config: ConfigService) => {\n    const connection = await createConnection({\n      type: 'postgres',\n      host: config.get('DB_HOST'),\n      port: config.get('DB_PORT'),\n    });\n    return connection;\n  },\n  inject: [ConfigService],\n}`,
      `// Injecting custom token\n@Injectable()\nexport class CatsService {\n  constructor(\n    @Inject('DATABASE_CONNECTION')\n    private readonly connection: Connection,\n  ) {}\n}`,
      `// Optional dependency\n@Injectable()\nexport class CatsService {\n  constructor(\n    @Optional()\n    @Inject('CACHE_MANAGER')\n    private readonly cache?: CacheManager,\n  ) {}\n  \n  async findOne(id: string) {\n    if (this.cache) {\n      const cached = await this.cache.get(id);\n      if (cached) return cached;\n    }\n    return this.repository.findOne(id);\n  }\n}`,
      `// Async provider registration\nconst databaseProviders = [\n  {\n    provide: 'DATA_SOURCE',\n    useFactory: async () => {\n      const dataSource = new DataSource({\n        type: 'postgres',\n        entities: [Cat],\n      });\n      return dataSource.initialize();\n    },\n  },\n];`,
    ],
  },
  {
    name: "Controller & Route Design",
    description: "Build RESTful controllers with proper validation, DTOs, and response handling.",
    guidance:
      "Use @Controller decorator with route prefix. Implement HTTP methods with decorators. Use DTOs with class-validator. Return proper HTTP status codes. Document with Swagger decorators.",
    examples: [
      `// RESTful controller with validation\nimport { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';\nimport { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';\n\n@ApiTags('cats')\n@Controller('cats')\nexport class CatsController {\n  constructor(private readonly catsService: CatsService) {}\n  \n  @Post()\n  @HttpCode(HttpStatus.CREATED)\n  @ApiOperation({ summary: 'Create a new cat' })\n  @ApiResponse({ status: 201, description: 'Cat created', type: Cat })\n  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {\n    return this.catsService.create(createCatDto);\n  }\n  \n  @Get()\n  @ApiOperation({ summary: 'Get all cats' })\n  @ApiResponse({ status: 200, type: [Cat] })\n  async findAll(): Promise<Cat[]> {\n    return this.catsService.findAll();\n  }\n  \n  @Get(':id')\n  @ApiResponse({ status: 200, type: Cat })\n  @ApiResponse({ status: 404, description: 'Cat not found' })\n  async findOne(@Param('id') id: string): Promise<Cat> {\n    return this.catsService.findOne(id);\n  }\n  \n  @Put(':id')\n  async update(\n    @Param('id') id: string,\n    @Body() updateCatDto: UpdateCatDto,\n  ): Promise<Cat> {\n    return this.catsService.update(id, updateCatDto);\n  }\n  \n  @Delete(':id')\n  @HttpCode(HttpStatus.NO_CONTENT)\n  async remove(@Param('id') id: string): Promise<void> {\n    return this.catsService.remove(id);\n  }\n}`,
      `// DTO with validation\nimport { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';\nimport { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';\n\nexport class CreateCatDto {\n  @ApiProperty({ example: 'Fluffy' })\n  @IsString()\n  name: string;\n  \n  @ApiProperty({ example: 3, minimum: 0, maximum: 30 })\n  @IsInt()\n  @Min(0)\n  @Max(30)\n  age: number;\n  \n  @ApiPropertyOptional({ example: 'Maine Coon' })\n  @IsOptional()\n  @IsString()\n  breed?: string;\n}`,
      `// Query parameters and pagination\n@Get()\nasync findAll(\n  @Query('page') page: number = 1,\n  @Query('limit') limit: number = 10,\n  @Query('search') search?: string,\n): Promise<PaginatedResult<Cat>> {\n  return this.catsService.findAll({ page, limit, search });\n}`,
    ],
  },
  {
    name: "Provider Patterns (useFactory, useClass, useValue)",
    description: "Implement custom providers for configuration, database connections, and external services.",
    guidance:
      "Use useClass for alternative implementations. Use useValue for constants. Use useFactory for async initialization or complex logic. Leverage inject array for dependencies.",
    examples: [
      `// useClass - Alternative implementation\n@Module({\n  providers: [\n    {\n      provide: CatsService,\n      useClass: process.env.NODE_ENV === 'production'\n        ? ProductionCatsService\n        : DevelopmentCatsService,\n    },\n  ],\n})\nexport class CatsModule {}`,
      `// useValue - Configuration object\n@Module({\n  providers: [\n    {\n      provide: 'CONFIG',\n      useValue: {\n        apiKey: process.env.API_KEY,\n        baseUrl: process.env.BASE_URL,\n      },\n    },\n  ],\n})\nexport class AppModule {}`,
      `// useFactory - Async initialization\n@Module({\n  providers: [\n    {\n      provide: 'REDIS_CLIENT',\n      useFactory: async (config: ConfigService) => {\n        const client = createClient({\n          url: config.get('REDIS_URL'),\n        });\n        await client.connect();\n        return client;\n      },\n      inject: [ConfigService],\n    },\n  ],\n})\nexport class CacheModule {}`,
      `// Factory with conditional logic\n{\n  provide: 'LOGGER',\n  useFactory: (config: ConfigService) => {\n    const logLevel = config.get('LOG_LEVEL');\n    return logLevel === 'debug'\n      ? new DetailedLogger()\n      : new SimpleLogger();\n  },\n  inject: [ConfigService],\n}`,
    ],
  },
  {
    name: "Testing Strategies",
    description: "Write comprehensive unit and E2E tests using NestJS testing utilities.",
    guidance:
      "Use Test.createTestingModule for unit tests. Mock dependencies properly. Use app fixture for E2E tests. Test controllers, services, and guards independently.",
    examples: [
      `// Unit test for service\nimport { Test, TestingModule } from '@nestjs/testing';\nimport { CatsService } from './cats.service';\nimport { CatsRepository } from './cats.repository';\n\ndescribe('CatsService', () => {\n  let service: CatsService;\n  let repository: CatsRepository;\n  \n  beforeEach(async () => {\n    const module: TestingModule = await Test.createTestingModule({\n      providers: [\n        CatsService,\n        {\n          provide: CatsRepository,\n          useValue: {\n            findAll: jest.fn(),\n            findOne: jest.fn(),\n            create: jest.fn(),\n          },\n        },\n      ],\n    }).compile();\n    \n    service = module.get<CatsService>(CatsService);\n    repository = module.get<CatsRepository>(CatsRepository);\n  });\n  \n  describe('findAll', () => {\n    it('should return an array of cats', async () => {\n      const result = [{ id: '1', name: 'Fluffy', age: 3 }];\n      jest.spyOn(repository, 'findAll').mockResolvedValue(result);\n      \n      expect(await service.findAll()).toBe(result);\n      expect(repository.findAll).toHaveBeenCalled();\n    });\n  });\n});`,
      `// Unit test for controller\ndescribe('CatsController', () => {\n  let controller: CatsController;\n  let service: CatsService;\n  \n  beforeEach(async () => {\n    const module: TestingModule = await Test.createTestingModule({\n      controllers: [CatsController],\n      providers: [\n        {\n          provide: CatsService,\n          useValue: {\n            findAll: jest.fn(),\n            create: jest.fn(),\n          },\n        },\n      ],\n    }).compile();\n    \n    controller = module.get<CatsController>(CatsController);\n    service = module.get<CatsService>(CatsService);\n  });\n  \n  it('should create a cat', async () => {\n    const dto = { name: 'Fluffy', age: 3 };\n    const result = { id: '1', ...dto };\n    jest.spyOn(service, 'create').mockResolvedValue(result);\n    \n    expect(await controller.create(dto)).toBe(result);\n  });\n});`,
      `// E2E test\nimport { Test } from '@nestjs/testing';\nimport { INestApplication } from '@nestjs/common';\nimport * as request from 'supertest';\nimport { AppModule } from '../src/app.module';\n\ndescribe('CatsController (e2e)', () => {\n  let app: INestApplication;\n  \n  beforeAll(async () => {\n    const moduleFixture = await Test.createTestingModule({\n      imports: [AppModule],\n    }).compile();\n    \n    app = moduleFixture.createNestApplication();\n    await app.init();\n  });\n  \n  afterAll(async () => {\n    await app.close();\n  });\n  \n  it('/cats (POST)', () => {\n    return request(app.getHttpServer())\n      .post('/cats')\n      .send({ name: 'Fluffy', age: 3 })\n      .expect(201)\n      .expect((res) => {\n        expect(res.body).toHaveProperty('id');\n        expect(res.body.name).toBe('Fluffy');\n      });\n  });\n});`,
    ],
  },
  {
    name: "Guards, Interceptors & Middleware",
    description: "Implement guards for authentication/authorization, interceptors for logging/transformation, and middleware for request processing.",
    guidance:
      "Use guards to control access based on roles or authentication. Use interceptors for logging, transformation, or caching. Use middleware for request preprocessing. Apply at global, controller, or route level.",
    examples: [
      `// Authentication guard\nimport { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';\nimport { JwtService } from '@nestjs/jwt';\n\n@Injectable()\nexport class AuthGuard implements CanActivate {\n  constructor(private jwtService: JwtService) {}\n  \n  canActivate(context: ExecutionContext): boolean {\n    const request = context.switchToHttp().getRequest();\n    const token = request.headers.authorization?.split(' ')[1];\n    \n    if (!token) {\n      throw new UnauthorizedException('No token provided');\n    }\n    \n    try {\n      const payload = this.jwtService.verify(token);\n      request.user = payload;\n      return true;\n    } catch {\n      throw new UnauthorizedException('Invalid token');\n    }\n  }\n}\n\n// Usage\n@Controller('cats')\n@UseGuards(AuthGuard)\nexport class CatsController {}`,
      `// Role-based guard\nimport { Reflector } from '@nestjs/core';\n\n@Injectable()\nexport class RolesGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n  \n  canActivate(context: ExecutionContext): boolean {\n    const roles = this.reflector.get<string[]>('roles', context.getHandler());\n    if (!roles) return true;\n    \n    const request = context.switchToHttp().getRequest();\n    const user = request.user;\n    \n    return roles.some(role => user?.roles?.includes(role));\n  }\n}\n\n// Custom decorator\nexport const Roles = (...roles: string[]) => SetMetadata('roles', roles);\n\n// Usage\n@Post()\n@Roles('admin')\n@UseGuards(AuthGuard, RolesGuard)\nasync create(@Body() dto: CreateCatDto) {}`,
      `// Logging interceptor\nimport { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';\nimport { Observable } from 'rxjs';\nimport { tap } from 'rxjs/operators';\n\n@Injectable()\nexport class LoggingInterceptor implements NestInterceptor {\n  private readonly logger = new Logger(LoggingInterceptor.name);\n  \n  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {\n    const req = context.switchToHttp().getRequest();\n    const method = req.method;\n    const url = req.url;\n    const now = Date.now();\n    \n    return next.handle().pipe(\n      tap(() => {\n        const duration = Date.now() - now;\n        this.logger.log(\`\${method} \${url} - \${duration}ms\`);\n      }),\n    );\n  }\n}`,
      `// Transform interceptor\n@Injectable()\nexport class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {\n  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {\n    return next.handle().pipe(\n      map(data => ({\n        success: true,\n        data,\n        timestamp: new Date().toISOString(),\n      })),\n    );\n  }\n}\n\ninterface Response<T> {\n  success: boolean;\n  data: T;\n  timestamp: string;\n}`,
      `// Global application of guards and interceptors\nconst app = await NestFactory.create(AppModule);\napp.useGlobalGuards(new RolesGuard());\napp.useGlobalInterceptors(new LoggingInterceptor());\nawait app.listen(3000);`,
    ],
  },
];

const CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  modules: [
    /module/i,
    /feature.*module/i,
    /architecture/i,
    /organize/i,
    /structure/i,
  ],
  dependencyInjection: [
    /inject/i,
    /provider/i,
    /dependency.*injection/i,
    /di/i,
    /custom.*provider/i,
  ],
  controllers: [
    /controller/i,
    /route/i,
    /endpoint/i,
    /api/i,
    /rest/i,
  ],
  providers: [
    /service/i,
    /provider/i,
    /factory/i,
    /useFactory/i,
    /useClass/i,
    /useValue/i,
  ],
  testing: [
    /test/i,
    /testing/i,
    /jest/i,
    /unit.*test/i,
    /e2e/i,
    /integration.*test/i,
  ],
  middleware: [
    /guard/i,
    /interceptor/i,
    /pipe/i,
    /middleware/i,
    /auth/i,
    /validation/i,
  ],
  database: [
    /database/i,
    /orm/i,
    /typeorm/i,
    /prisma/i,
    /mongoose/i,
    /repository/i,
  ],
};

export class NestJSFrameworkSpecialist {
  async generateNestJSSpecificReasoning(
    problem: string,
    context: NestJSReasoningContext,
    codeContext?: string
  ): Promise<NestJSReasoningResult> {
    const category = this.categorize(problem);
    const contextSummary = this.buildContextSummary(context);
    const selectedPatterns = this.selectPatterns(category, context);
    const recommendations = this.generateRecommendations(category, context);
    const examples = this.generateExamples(category);

    const reasoning: string[] = [
      `Analyzing NestJS ${category} problem:`,
      `Context: ${contextSummary}`,
      `Recommended approach: ${selectedPatterns.map((p) => p.name).join(", ")}`,
    ];

    if (codeContext) {
      const codeAnalysis = this.generateCodeContextSummary(codeContext);
      reasoning.push(`Code analysis: ${codeAnalysis}`);
    }

    return {
      framework: "nestjs",
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

  private buildContextSummary(context: NestJSReasoningContext): string {
    const parts: string[] = [];

    if (context.moduleArchitecture) {
      parts.push(`${context.moduleArchitecture} architecture`);
    }
    if (context.dependencyInjection) {
      parts.push(`${context.dependencyInjection} DI`);
    }
    if (context.apiStyle) {
      parts.push(`${context.apiStyle} API`);
    }
    if (context.ormLibrary) {
      parts.push(`${context.ormLibrary} ORM`);
    }
    if (context.version) {
      parts.push(`NestJS ${context.version}`);
    }

    return parts.length > 0 ? parts.join(", ") : "default NestJS setup";
  }

  private selectPatterns(category: string, context: NestJSReasoningContext): ReasoningPattern[] {
    const categoryPatternMap: Record<string, string[]> = {
      modules: ["Module Organization & Architecture"],
      dependencyInjection: ["Dependency Injection Patterns"],
      controllers: ["Controller & Route Design"],
      providers: ["Provider Patterns (useFactory, useClass, useValue)"],
      testing: ["Testing Strategies"],
      middleware: ["Guards, Interceptors & Middleware"],
      database: ["Module Organization & Architecture", "Dependency Injection Patterns"],
    };

    const patternNames = categoryPatternMap[category] || ["Dependency Injection Patterns"];
    return PATTERNS.filter((p) => patternNames.includes(p.name));
  }

  private generateRecommendations(category: string, context: NestJSReasoningContext): string[] {
    const recommendations: string[] = [];

    // Category-specific recommendations
    if (category === "modules") {
      recommendations.push(
        "Organize features into dedicated modules with clear boundaries",
        "Use @Global() sparingly - only for truly shared utilities",
        "Export only what needs to be shared - keep internals private",
        "Consider dynamic modules for configurable features"
      );
    } else if (category === "dependencyInjection") {
      recommendations.push(
        "Prefer constructor injection over property injection",
        "Use @Injectable() on all providers for DI container management",
        "Leverage custom providers (useFactory) for async initialization",
        "Use @Optional() for truly optional dependencies"
      );
    } else if (category === "controllers") {
      recommendations.push(
        "Use DTOs with class-validator for all input validation",
        "Return proper HTTP status codes with @HttpCode decorator",
        "Document APIs with @nestjs/swagger decorators",
        "Keep controllers thin - delegate logic to services"
      );
    } else if (category === "providers") {
      recommendations.push(
        "Use useFactory for async initialization or complex logic",
        "Use useClass for alternative implementations based on environment",
        "Use useValue for simple constants or configuration objects",
        "Leverage inject array to specify provider dependencies"
      );
    } else if (category === "testing") {
      recommendations.push(
        "Use Test.createTestingModule for isolated unit tests",
        "Mock external dependencies properly with custom providers",
        "Write E2E tests for critical user journeys",
        "Test guards, interceptors, and pipes independently"
      );
    } else if (category === "middleware") {
      recommendations.push(
        "Use guards for authentication and authorization logic",
        "Use interceptors for cross-cutting concerns (logging, caching)",
        "Use pipes for data transformation and validation",
        "Apply global middleware in main.ts for app-wide concerns"
      );
    } else if (category === "database") {
      if (context.ormLibrary === "typeorm") {
        recommendations.push("Use TypeORM repositories with @InjectRepository decorator");
      } else if (context.ormLibrary === "prisma") {
        recommendations.push("Use PrismaService as a global provider for database access");
      } else if (context.ormLibrary === "mongoose") {
        recommendations.push("Use @InjectModel for Mongoose model injection");
      }
      recommendations.push(
        "Implement repository pattern to abstract database operations",
        "Use transactions for operations requiring atomicity"
      );
    }

    // Context-based recommendations
    if (context.moduleArchitecture === "monolithic") {
      recommendations.push(
        "Consider migrating to feature modules for better maintainability as the app grows"
      );
    }

    if (context.moduleArchitecture === "microservices") {
      recommendations.push(
        "Use @nestjs/microservices for inter-service communication",
        "Implement proper error handling and retries for distributed systems"
      );
    }

    if (!context.strictMode) {
      recommendations.push(
        "Enable TypeScript strict mode for better type safety and fewer runtime errors"
      );
    }

    return recommendations;
  }

  private generateExamples(category: string): string[] {
    const pattern = PATTERNS.find((p) => {
      if (category === "modules") return p.name === "Module Organization & Architecture";
      if (category === "dependencyInjection") return p.name === "Dependency Injection Patterns";
      if (category === "controllers") return p.name === "Controller & Route Design";
      if (category === "providers") return p.name === "Provider Patterns (useFactory, useClass, useValue)";
      if (category === "testing") return p.name === "Testing Strategies";
      if (category === "middleware") return p.name === "Guards, Interceptors & Middleware";
      return false;
    });

    return pattern?.examples || PATTERNS[1].examples; // Default to DI Patterns
  }

  private generateCodeContextSummary(codeContext: string): string {
    const insights: string[] = [];

    if (/@Module\s*\(/i.test(codeContext)) {
      insights.push("Module definition detected");
    }
    if (/@Controller\s*\(/i.test(codeContext)) {
      insights.push("Controller detected");
    }
    if (/@Injectable\s*\(/i.test(codeContext)) {
      insights.push("Injectable provider detected");
    }

    if (/@Get\s*\(|@Post\s*\(|@Put\s*\(|@Delete\s*\(/i.test(codeContext)) {
      insights.push("HTTP route handlers present");
    }

    if (/useFactory|useClass|useValue/i.test(codeContext)) {
      insights.push("Custom provider pattern detected");
    }

    if (/@UseGuards|@UseInterceptors|@UsePipes/i.test(codeContext)) {
      insights.push("Middleware decorators in use");
    }

    if (/Test\.createTestingModule/i.test(codeContext)) {
      insights.push("Testing setup detected");
    }

    if (/@InjectRepository|@InjectModel/i.test(codeContext)) {
      insights.push("ORM integration detected");
    }

    if (/@ApiTags|@ApiOperation|@ApiResponse/i.test(codeContext)) {
      insights.push("Swagger documentation present");
    }

    return insights.length > 0
      ? insights.join("; ")
      : "Standard NestJS structure";
  }
}
