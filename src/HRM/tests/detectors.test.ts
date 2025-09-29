import { describe, expect, it } from "vitest";
import { ExpressDetector } from "../frameworks/detectors/expressDetector.js";
import { PostgreSQLDetector } from "../frameworks/detectors/postgresDetector.js";
import { PrismaDetector } from "../frameworks/detectors/prismaDetector.js";
import { ReactDetector } from "../frameworks/detectors/reactDetector.js";
import type { DetectionContext } from "../frameworks/types.js";

const baseContext = (): DetectionContext => ({
  packageInfo: {
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
  },
  fileStructure: [],
  codePatterns: [],
  workspacePath: "/tmp/mock-workspace",
});

describe("framework detectors", () => {
  it("react detector requires sufficient evidence before emitting a signature", async () => {
    const detector = new ReactDetector();
    const positiveContext = baseContext();
    positiveContext.packageInfo.dependencies.react = "18.2.0";
    positiveContext.packageInfo.dependencies["react-dom"] = "18.2.0";
    positiveContext.codePatterns.push({ identifier: "react_component", matchedPaths: ["src/App.tsx"] });

    const signature = await detector.detect(positiveContext);
    expect(signature).not.toBeNull();
    expect(signature?.confidence).toBeGreaterThanOrEqual(0.35);

    const negativeContext = baseContext();
    const absentSignature = await detector.detect(negativeContext);
    expect(absentSignature).toBeNull();
  });

  it("express detector emits only when dependencies indicate express usage", async () => {
    const detector = new ExpressDetector();
    const positiveContext = baseContext();
    positiveContext.packageInfo.dependencies.express = "4.18.2";
    positiveContext.fileStructure.push({ path: "src/routes/user.ts", isDirectory: false });

    const signature = await detector.detect(positiveContext);
    expect(signature).not.toBeNull();
    expect(signature?.confidence).toBeGreaterThanOrEqual(0.4);

    const negativeContext = baseContext();
    negativeContext.fileStructure.push({ path: "src/routes/user.ts", isDirectory: false });
    const absentSignature = await detector.detect(negativeContext);
    expect(absentSignature).toBeNull();
  });

  it("prisma detector validates presence of prisma dependencies", async () => {
    const detector = new PrismaDetector();
    const positiveContext = baseContext();
    positiveContext.packageInfo.dependencies["@prisma/client"] = "5.0.0";
    positiveContext.fileStructure.push({ path: "prisma/schema.prisma", isDirectory: false });

    const signature = await detector.detect(positiveContext);
    expect(signature).not.toBeNull();
    expect(signature?.confidence).toBeGreaterThanOrEqual(0.45);

    const negativeContext = baseContext();
    negativeContext.fileStructure.push({ path: "prisma/schema.prisma", isDirectory: false });
    const absentSignature = await detector.detect(negativeContext);
    expect(absentSignature).toBeNull();
  });

  it("postgres detector infers postgres usage when relevant dependencies exist", async () => {
    const detector = new PostgreSQLDetector();
    const positiveContext = baseContext();
    positiveContext.packageInfo.dependencies.pg = "8.11.0";
    positiveContext.fileStructure.push({ path: "database/migrations/init.sql", isDirectory: false });

    const signature = await detector.detect(positiveContext);
    expect(signature).not.toBeNull();
    expect(signature?.confidence).toBeGreaterThanOrEqual(0.4);

    const negativeContext = baseContext();
    negativeContext.fileStructure.push({ path: "database/migrations/init.sql", isDirectory: false });
    const absentSignature = await detector.detect(negativeContext);
    expect(absentSignature).toBeNull();
  });
});
