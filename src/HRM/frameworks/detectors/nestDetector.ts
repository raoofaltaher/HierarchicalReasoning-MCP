import { DetectionContext, DetectionResult, FrameworkCapability } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

export class NestJSDetector extends FrameworkDetector {
  async detect(context: DetectionContext) {
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "@nestjs/core",
        weight: 0.4,
        matched: this.hasDependency(context, "@nestjs/core"),
      },
      {
        type: "dependency",
        pattern: "@nestjs/common",
        weight: 0.25,
        matched: this.hasDependency(context, "@nestjs/common"),
      },
      {
        type: "file_pattern",
        pattern: "nest-cli.json",
        weight: 0.15,
        matched: this.hasFileContaining(context, /nest-cli\.json$/i),
      },
      {
        type: "file_pattern",
        pattern: "*.controller.ts files",
        weight: 0.1,
        matched: this.hasFileContaining(context, /\.controller\.ts$/i),
      },
      {
        type: "code_pattern",
        pattern: "nestjs_decorator",
        weight: 0.1,
        matched: this.hasCodePattern(context, "nestjs_decorator"),
      },
    ];

    const version = this.getVersion(context, "@nestjs/core");
    const capabilities: FrameworkCapability[] = [
      {
        category: "backend",
        features: ["modules", "controllers", "providers", "dependency_injection", "decorators"],
        patterns: [
          {
            name: "Module Architecture",
            description: "Organize application logic into feature modules for better maintainability.",
            guidance: "Use @Module decorator to group related controllers and providers. Export providers that need to be shared across modules.",
            examples: [
              `@Module({\n  imports: [DatabaseModule],\n  controllers: [CatsController],\n  providers: [CatsService],\n  exports: [CatsService]\n})\nexport class CatsModule {}`,
            ],
          },
          {
            name: "Dependency Injection",
            description: "Leverage NestJS's powerful DI system for loose coupling and testability.",
            guidance: "Use constructor injection for services. Mark providers with @Injectable(). Use custom providers for advanced scenarios.",
            examples: [
              `@Injectable()\nexport class CatsService {\n  constructor(private readonly catsRepository: CatsRepository) {}\n}`,
              `@Controller('cats')\nexport class CatsController {\n  constructor(private readonly catsService: CatsService) {}\n}`,
            ],
          },
          {
            name: "Controller Design",
            description: "Design RESTful or GraphQL controllers with proper route handling and validation.",
            guidance: "Use @Controller decorator with route prefix. Implement HTTP method handlers with @Get, @Post, @Put, @Delete. Use DTOs with class-validator.",
            examples: [
              `@Controller('cats')\nexport class CatsController {\n  @Post()\n  async create(@Body() createCatDto: CreateCatDto) {\n    return this.catsService.create(createCatDto);\n  }\n  \n  @Get(':id')\n  findOne(@Param('id') id: string) {\n    return this.catsService.findOne(id);\n  }\n}`,
            ],
          },
        ],
      },
      {
        category: "database",
        features: ["typeorm", "prisma", "mongoose", "repository_pattern"],
        patterns: [
          {
            name: "ORM Integration",
            description: "Integrate with TypeORM, Prisma, or Mongoose for database operations.",
            guidance: "Import ORM modules in AppModule. Define entities/models. Use repository or service pattern for data access.",
            examples: [
              `// TypeORM\n@Module({\n  imports: [\n    TypeOrmModule.forRoot({\n      type: 'postgres',\n      host: 'localhost',\n      entities: [Cat]\n    }),\n    TypeOrmModule.forFeature([Cat])\n  ]\n})`,
              `// Prisma\n@Injectable()\nexport class CatsService {\n  constructor(private prisma: PrismaService) {}\n  \n  async findAll() {\n    return this.prisma.cat.findMany();\n  }\n}`,
            ],
          },
        ],
      },
      {
        category: "routing",
        features: ["rest_api", "graphql", "microservices"],
        patterns: [
          {
            name: "API Design",
            description: "Build REST or GraphQL APIs with proper versioning and documentation.",
            guidance: "Use @Controller for REST endpoints. Use @Resolver for GraphQL. Implement Swagger/OpenAPI with @nestjs/swagger.",
            examples: [
              `@ApiTags('cats')\n@Controller('cats')\nexport class CatsController {\n  @ApiOperation({ summary: 'Get all cats' })\n  @ApiResponse({ status: 200, type: [Cat] })\n  @Get()\n  findAll(): Promise<Cat[]> {\n    return this.catsService.findAll();\n  }\n}`,
            ],
          },
        ],
      },
      {
        category: "testing",
        features: ["jest", "e2e_testing", "unit_testing", "mocking"],
        patterns: [
          {
            name: "Testing Strategies",
            description: "Write comprehensive unit and E2E tests using Jest and NestJS testing utilities.",
            guidance: "Use Test.createTestingModule for unit tests. Mock dependencies. Use app.test.ts for E2E tests.",
            examples: [
              `describe('CatsService', () => {\n  let service: CatsService;\n  \n  beforeEach(async () => {\n    const module = await Test.createTestingModule({\n      providers: [CatsService]\n    }).compile();\n    \n    service = module.get(CatsService);\n  });\n  \n  it('should find all cats', () => {\n    expect(service.findAll()).toBeDefined();\n  });\n});`,
            ],
          },
        ],
      },
    ];

    return this.buildSignature("NestJS", version, indicators, capabilities);
  }

  private hasDependency(context: DetectionContext, name: string): boolean {
    const { dependencies, devDependencies, peerDependencies } = context.packageInfo;
    return Boolean(dependencies?.[name] || devDependencies?.[name] || peerDependencies?.[name]);
  }

  private hasFileContaining(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => pattern.test(node.path));
  }

  private hasCodePattern(context: DetectionContext, identifier: string): boolean {
    return context.codePatterns.some((pattern) => pattern.identifier === identifier);
  }

  private getVersion(context: DetectionContext, dependency: string): string | undefined {
    return (
      context.packageInfo.dependencies?.[dependency] ||
      context.packageInfo.devDependencies?.[dependency] ||
      context.packageInfo.peerDependencies?.[dependency]
    );
  }
}
