import fs from "fs";
import path from "path";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

type Operation = {
  summary: string;
  operationId: string;
  tags: string[];
  responses: {
    default: { description: string };
  };
};

type Paths = Record<
  string,
  Partial<Record<Lowercase<HttpMethod>, Operation>>
>;

export type OpenApiSpec = {
  openapi: "3.1.0";
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string }[];
  paths: Paths;
};

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
const API_DIR = path.join(process.cwd(), "src", "app", "api");

const detectMethods = (content: string): HttpMethod[] => {
  const upper = content.toUpperCase();
  return HTTP_METHODS.filter((method) => {
    const patternFn = new RegExp(`export\\s+async\\s+function\\s+${method}\\b`, "i");
    const patternFnPlain = new RegExp(`export\\s+function\\s+${method}\\b`, "i");
    const patternConst = new RegExp(`export\\s+const\\s+${method}\\s*=`, "i");
    return patternFn.test(content) || patternFnPlain.test(content) || patternConst.test(content) || upper.includes(` ${method}(`);
  });
};

const normalizeSegment = (segment: string) => {
  if (/^\[\.\.\..+\]$/.test(segment)) {
    return `{${segment.slice(4, -1)}}`;
  }
  if (/^\[.+\]$/.test(segment)) {
    return `{${segment.slice(1, -1)}}`;
  }
  return segment;
};

const toApiPath = (filePath: string) => {
  const relative = path.relative(API_DIR, filePath).replace(/\\/g, "/");
  const withoutRoute = relative.replace(/\/route\.(ts|tsx|js|mjs|cjs)$/, "");
  const segments = withoutRoute.split("/").map(normalizeSegment).join("/");
  return `/api/${segments}`;
};

const collectRouteFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectRouteFiles(fullPath);
    }
    if (entry.isFile() && /^route\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) {
      return [fullPath];
    }
    return [];
  });
};

const buildOperationId = (method: HttpMethod, apiPath: string) =>
  `${method.toLowerCase()}${apiPath.replace(/[^a-zA-Z0-9]+/g, "_")}`;

export const generateOpenApiSpec = (): OpenApiSpec => {
  const paths: Paths = {};
  const routeFiles = collectRouteFiles(API_DIR);

  routeFiles.forEach((filePath) => {
    const routeContent = fs.readFileSync(filePath, "utf8");
    const methods = detectMethods(routeContent);
    if (!methods.length) return;

    const apiPath = toApiPath(filePath);
    const segments = apiPath.split("/").filter(Boolean);
    const tag = segments[1] || "api";

    paths[apiPath] = paths[apiPath] || {};
    methods.forEach((method) => {
      const lower = method.toLowerCase() as Lowercase<HttpMethod>;
      paths[apiPath]![lower] = {
        summary: `${method} ${apiPath}`,
        operationId: buildOperationId(method, apiPath),
        tags: [tag],
        responses: {
          default: { description: "Response" },
        },
      };
    });
  });

  return {
    openapi: "3.1.0",
    info: {
      title: "IPMS API",
      version: "1.0.0",
      description: "Auto-generated Swagger spec from Next.js route handlers.",
    },
    servers: [{ url: "/" }],
    paths,
  };
};
