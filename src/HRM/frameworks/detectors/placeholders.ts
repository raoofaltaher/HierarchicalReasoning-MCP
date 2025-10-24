import { DetectionContext, FrameworkSignature } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

class NullDetector extends FrameworkDetector {
  constructor(private readonly frameworkName: string) {
    super();
  }

  async detect(_context: DetectionContext): Promise<FrameworkSignature | null> {
    return null;
  }
}

export class FastifyDetector extends NullDetector {
  constructor() {
    super("fastify");
  }
}

export class NestJSDetector extends NullDetector {
  constructor() {
    super("nestjs");
  }
}

export class MongoDBDetector extends NullDetector {
  constructor() {
    super("mongodb");
  }
}

export class MySQLDetector extends NullDetector {
  constructor() {
    super("mysql");
  }
}

export class TypeORMDetector extends NullDetector {
  constructor() {
    super("typeorm");
  }
}
