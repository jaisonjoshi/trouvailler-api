import { Project, SyntaxKind, Node, CallExpression } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

console.log("Initializing ts-morph project spanning all three Trouvailler workspaces (admin, api, frontend)...");

// Initialize ts-morph project without config file since API is JS-only
const project = new Project({
  compilerOptions: {
    allowJs: true,
    checkJs: false,
  },
});

const projectRoot = project.getDirectory(".")?.getPath() || "";

const workspaces = [
  {
    name: "admin",
    pathSuffix: "trouvailler-admin",
    paths: [
      "../trouvailler-admin/src/**/*.ts",
      "../trouvailler-admin/src/**/*.tsx",
    ],
  },
  {
    name: "api",
    pathSuffix: "trouvailler-api",
    paths: [
      "routes/**/*.js",
      "controllers/**/*.js",
      "services/**/*.js",
      "validation/**/*.js",
      "models/**/*.js",
    ],
  },
  {
    name: "frontend",
    pathSuffix: "trouvailler-frontend",
    paths: [
      "../trouvailler-frontend/app/**/*.ts",
      "../trouvailler-frontend/app/**/*.tsx",
      "../trouvailler-frontend/components/**/*.ts",
      "../trouvailler-frontend/components/**/*.tsx",
      "../trouvailler-frontend/types/**/*.ts",
      "../trouvailler-frontend/types/**/*.tsx",
    ],
  },
];

const workspaceRoots = workspaces.map(w => {
  const absPath = path.resolve(projectRoot, w.name === "api" ? "." : `../${w.pathSuffix}`);
  return {
    name: w.name,
    rootPath: absPath,
  };
});

// Helper to clean paths: relative to each project root with project name prefix
const cleanPath = (absolutePath: string) => {
  for (const ws of workspaceRoots) {
    if (absolutePath.startsWith(ws.rootPath)) {
      return `${ws.name}/` + path.relative(ws.rootPath, absolutePath);
    }
  }
  return path.relative(projectRoot, absolutePath);
};

const getProjectName = (cleanedPath: string): string => {
  for (const ws of workspaces) {
    if (cleanedPath.startsWith(`${ws.name}/`)) {
      return ws.name;
    }
  }
  return "api";
};

// Explicitly add source files from workspace configuration
for (const workspace of workspaces) {
  for (const pattern of workspace.paths) {
    project.addSourceFilesAtPaths(pattern);
  }
}

const sourceFiles = project.getSourceFiles().filter(file => {
  const rel = cleanPath(file.getFilePath());
  // Skip scanning node_modules or dependencies
  return !rel.includes("node_modules") && !rel.startsWith(".");
});

console.log(`Successfully indexed ${sourceFiles.length} files in the workspace.`);

interface FileNode {
  path: string;
  project: string;
  imports: string[];
  exports: string[];
}

interface SymbolNode {
  id: string; // e.g. "FUNC:src/handlers/packages.ts:getAllPackages"
  type: "FUNC" | "COMPONENT" | "SCHEMA" | "API" | "HOOK";
  name: string;
  file: string; // cleaned relative path
  project: string;
  startLine: number;
  endLine: number;
}

interface Edge {
  source: string;
  target: string;
  type: "imports" | "calls" | "defines" | "routes_to" | "renders" | "uses_hook" | "uses_schema" | "calls_api" | "references";
}

const files: FileNode[] = [];
const symbols: SymbolNode[] = [];
const edges: Edge[] = [];

// Heuristics to check symbol type
const isZodSchema = (node: Node, name: string): boolean => {
  if (name.endsWith("Schema")) return true;
  const filePath = node.getSourceFile().getFilePath();
  if (filePath.includes("schema.ts") || filePath.includes("validation")) {
    return true;
  }
  return false;
};

const isReactComponent = (node: Node): boolean => {
  let name = "";
  if (Node.isVariableDeclaration(node) || Node.isFunctionDeclaration(node) || Node.isClassDeclaration(node)) {
    name = node.getName() || "";
  } else if (Node.isMethodDeclaration(node)) {
    name = node.getName();
  }

  if (name && /^[A-Z]/.test(name)) {
    const sourceFile = node.getSourceFile();
    if (sourceFile.getFilePath().endsWith(".tsx")) {
      return true;
    }
    if (
      node.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
      node.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0
    ) {
      return true;
    }
  }
  return false;
};

// Map declarations to SymbolNode for symbol resolutions
const declarationMap = new Map<Node, SymbolNode>();
const typeChecker = project.getTypeChecker();

// Helper to resolve aliases (imports) to definitions
const getResolvedSymbol = (sym: any) => {
  try {
    const aliased = typeChecker.getAliasedSymbol(sym);
    if (aliased) return aliased;
  } catch (e) {}
  return sym;
};

// ==========================================
// PASS 1: Identify all files and definitions
// ==========================================
for (const sourceFile of sourceFiles) {
  const filePath = cleanPath(sourceFile.getFilePath());
  const projectType = getProjectName(filePath);
  console.log(`Indexing definitions in [${projectType}]: ${filePath}`);

  // Resolve imports
  const fileImports: string[] = [];
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    const resolvedFile = importDecl.getModuleSpecifier().getSymbol()?.getDeclarations()?.[0]?.getSourceFile();
    if (resolvedFile) {
      fileImports.push(cleanPath(resolvedFile.getFilePath()));
    } else if (moduleSpecifier.startsWith(".")) {
      fileImports.push(moduleSpecifier);
    }
  }

  // Resolve ESM imports in backend (e.g. require() or import ... from ...)
  const importCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of importCalls) {
    if (call.getExpression().getText() === "require") {
      const arg = call.getArguments()[0];
      if (arg && Node.isStringLiteral(arg)) {
        fileImports.push(arg.getLiteralValue());
      }
    }
  }

  const fileExports: string[] = [];
  for (const [name] of sourceFile.getExportedDeclarations()) {
    fileExports.push(name);
  }

  files.push({
    path: filePath,
    project: projectType,
    imports: fileImports,
    exports: fileExports,
  });

  // Track file-to-file import relationships
  for (const imp of fileImports) {
    if (!imp.includes("node_modules") && workspaces.some(ws => imp.startsWith(`${ws.name}/`))) {
      edges.push({
        source: `FILE:${filePath}`,
        target: `FILE:${imp}`,
        type: "imports",
      });
    }
  }

  // Helper to add SymbolNode
  const addSymbol = (node: Node, name: string, type: SymbolNode["type"]) => {
    const startLine = node.getStartLineNumber();
    const endLine = node.getEndLineNumber();
    const id = `${type}:${filePath}:${name}`;
    
    const symbolNode: SymbolNode = {
      id,
      type,
      name,
      file: filePath,
      project: projectType,
      startLine,
      endLine,
    };
    
    symbols.push(symbolNode);
    declarationMap.set(node, symbolNode);

    // Defines edge
    edges.push({
      source: `FILE:${filePath}`,
      target: id,
      type: "defines",
    });
  };

  // 1. Function Declarations
  for (const funcDecl of sourceFile.getFunctions()) {
    const name = funcDecl.getName();
    if (name) {
      const type = isZodSchema(funcDecl, name) ? "SCHEMA" : (isReactComponent(funcDecl) ? "COMPONENT" : "FUNC");
      addSymbol(funcDecl, name, type);
    }
  }

  // 2. Variable-bound Arrow Functions / Schemas / Components
  for (const varDecl of sourceFile.getVariableDeclarations()) {
    const initializer = varDecl.getInitializer();
    if (initializer) {
      const name = varDecl.getName();
      if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer) || isZodSchema(varDecl, name)) {
        const type = isZodSchema(varDecl, name) ? "SCHEMA" : (isReactComponent(varDecl) || /^[A-Z]/.test(name) ? "COMPONENT" : "FUNC");
        addSymbol(varDecl, name, type);
      }
    }
  }

  // 3. Class Methods
  for (const classDecl of sourceFile.getClasses()) {
    const className = classDecl.getName() || "AnonymousClass";
    for (const methodDecl of classDecl.getMethods()) {
      const methodName = methodDecl.getName();
      const fullName = `${className}.${methodName}`;
      addSymbol(methodDecl, fullName, "FUNC");
    }
  }
}

// ==========================================
// PASS 2: Trace deeper AST relationships
// ==========================================
console.log("Analyzing deep AST relationships (calls, renders, hook/schema usage, API endpoints)...");

// Helper to extract REST API endpoint from axios/apiClient calls
const parseApiCall = (callExpr: CallExpression) => {
  const expr = callExpr.getExpression();
  if (Node.isPropertyAccessExpression(expr)) {
    const baseName = expr.getExpression().getText();
    const propName = expr.getName(); // get, post, put, delete
    
    if (baseName === "apiClient" && ["get", "post", "put", "delete"].includes(propName)) {
      const arg = callExpr.getArguments()[0];
      if (arg) {
        let routePath = "";
        if (Node.isStringLiteral(arg)) {
          routePath = arg.getLiteralValue();
        } else if (Node.isTemplateExpression(arg)) {
          const parts: string[] = [arg.getHead().getLiteralText()];
          for (const span of arg.getTemplateSpans()) {
            parts.push(":id"); // replace template vars with parameter path tags
            parts.push(span.getLiteral().getLiteralText());
          }
          routePath = parts.join("");
        } else if (Node.isNoSubstitutionTemplateLiteral(arg)) {
          routePath = arg.getLiteralText();
        }
        
        if (routePath) {
          return {
            method: propName.toUpperCase(),
            path: routePath,
          };
        }
      }
    }
  }
  return null;
};

for (const [sourceNode, sourceSymbol] of declarationMap.entries()) {
  const callExpressions = sourceNode.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const callExpr of callExpressions) {
    // 1. Check API Client Calls
    const apiCall = parseApiCall(callExpr);
    if (apiCall) {
      const apiNodeId = `API:${apiCall.method}:${apiCall.path}`;
      
      // Ensure API node is registered if not already present
      if (!symbols.some(s => s.id === apiNodeId)) {
        symbols.push({
          id: apiNodeId,
          type: "API",
          name: `${apiCall.method} ${apiCall.path}`,
          file: sourceSymbol.file,
          project: "api",
          startLine: 0,
          endLine: 0,
        });
      }
      
      edges.push({
        source: sourceSymbol.id,
        target: apiNodeId,
        type: "calls_api",
      });
      continue;
    }

    // 2. Trace Standard Function & Component Calls
    const expr = callExpr.getExpression();
    let symbol = expr.getSymbol() || typeChecker.getSymbolAtLocation(expr);
    
    if (symbol) {
      symbol = getResolvedSymbol(symbol);
      const declarations = symbol.getDeclarations();
      for (const decl of declarations) {
        const targetSymbol = declarationMap.get(decl);
        if (targetSymbol) {
          edges.push({
            source: sourceSymbol.id,
            target: targetSymbol.id,
            type: "calls",
          });
        }
      }
    }

    // 3. Trace Hooks Usage (starts with "use")
    const callName = expr.getText();
    if (/^use[A-Z]/.test(callName) || callName.startsWith("use")) {
      let hookSymbol = expr.getSymbol() || typeChecker.getSymbolAtLocation(expr);
      if (hookSymbol) {
        hookSymbol = getResolvedSymbol(hookSymbol);
        let customHookResolved = false;
        for (const decl of hookSymbol.getDeclarations()) {
          const targetSymbol = declarationMap.get(decl);
          if (targetSymbol) {
            edges.push({
              source: sourceSymbol.id,
              target: targetSymbol.id,
              type: "uses_hook",
            });
            customHookResolved = true;
          }
        }
        
        // If it's a library hook (e.g. useEffect, useQuery, useForm)
        if (!customHookResolved) {
          const hookNodeId = `HOOK:${callName}`;
          if (!symbols.some(s => s.id === hookNodeId)) {
            symbols.push({
              id: hookNodeId,
              type: "HOOK",
              name: callName,
              file: "node_modules",
              project: "admin",
              startLine: 0,
              endLine: 0,
            });
          }
          edges.push({
            source: sourceSymbol.id,
            target: hookNodeId,
            type: "uses_hook",
          });
        }
      }
    }
  }

  // 4. Trace React Component Render Trees (JSX Hierarchy)
  if (sourceSymbol.type === "COMPONENT") {
    const jsxElements = sourceNode.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).concat(sourceNode.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement));
    for (const element of jsxElements) {
      const tagNode = element.getTagNameNode();
      const tagName = tagNode.getText();
      if (/^[A-Z]/.test(tagName)) { // capital name component tags
        let tagSymbol = tagNode.getSymbol() || typeChecker.getSymbolAtLocation(tagNode);
        if (tagSymbol) {
          tagSymbol = getResolvedSymbol(tagSymbol);
          for (const decl of tagSymbol.getDeclarations()) {
            const targetSymbol = declarationMap.get(decl);
            if (targetSymbol && targetSymbol.type === "COMPONENT") {
              edges.push({
                source: sourceSymbol.id,
                target: targetSymbol.id,
                type: "renders",
              });
            }
          }
        }
      }
    }
  }

  // 5. Trace Event Handlers
  const jsxExpressions = sourceNode.getDescendantsOfKind(SyntaxKind.JsxExpression);
  for (const jsxExpr of jsxExpressions) {
    const jsxAttr = jsxExpr.getFirstAncestorByKind(SyntaxKind.JsxAttribute);
    if (jsxAttr) {
      const expr = jsxExpr.getExpression();
      if (expr) {
        let symbol = expr.getSymbol() || typeChecker.getSymbolAtLocation(expr);
        if (symbol) {
          symbol = getResolvedSymbol(symbol);
          for (const decl of symbol.getDeclarations()) {
            const targetSymbol = declarationMap.get(decl);
            if (targetSymbol) {
              edges.push({
                source: sourceSymbol.id,
                target: targetSymbol.id,
                type: "calls",
              });
            }
          }
        }
      }
    }
  }

  // 6. Trace Schema usages (Zod validations)
  const identifiers = sourceNode.getDescendantsOfKind(SyntaxKind.Identifier);
  for (const idNode of identifiers) {
    // Skip declarations names to avoid self-linking
    const parent = idNode.getParent();
    if (parent && ((Node.isVariableDeclaration(parent) && parent.getNameNode() === idNode) ||
                   (Node.isFunctionDeclaration(parent) && parent.getNameNode() === idNode))) {
      continue;
    }
    
    let symbol = idNode.getSymbol() || typeChecker.getSymbolAtLocation(idNode);
    if (symbol) {
      symbol = getResolvedSymbol(symbol);
      for (const decl of symbol.getDeclarations()) {
        const targetSymbol = declarationMap.get(decl);
        if (targetSymbol && targetSymbol.type === "SCHEMA") {
          edges.push({
            source: sourceSymbol.id,
            target: targetSymbol.id,
            type: "uses_schema",
          });
        }
      }
    }
  }

  // 7. Find References (Replicates VS Code compiler find-references behavior)
  let referencedSymbols: Node[] = [];
  try {
    if (Node.isFunctionDeclaration(sourceNode) || Node.isMethodDeclaration(sourceNode) || Node.isVariableDeclaration(sourceNode)) {
      const nameNode = (sourceNode as any).getNameNode?.();
      if (nameNode) {
        referencedSymbols = nameNode.findReferencesAsNodes();
      }
    }
  } catch (e) {}

  for (const refNode of referencedSymbols) {
    const refFile = refNode.getSourceFile();
    const cleanedRefFile = cleanPath(refFile.getFilePath());
    
    const containingCallable = refNode.getFirstAncestor(n => declarationMap.has(n));
    if (containingCallable) {
      const containerSymbol = declarationMap.get(containingCallable);
      if (containerSymbol && containerSymbol.id !== sourceSymbol.id) {
        edges.push({
          source: containerSymbol.id,
          target: sourceSymbol.id,
          type: "references",
        });
      }
    } else {
      edges.push({
        source: `FILE:${cleanedRefFile}`,
        target: sourceSymbol.id,
        type: "references",
      });
    }
  }
}

// ==========================================
// PASS 3: Trace Backend Routing Mappings
// ==========================================
console.log("Tracing backend routing maps...");
for (const sourceFile of sourceFiles) {
  const filePath = cleanPath(sourceFile.getFilePath());
  if (filePath.includes("routes")) {
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
      const expr = callExpr.getExpression();
      if (Node.isPropertyAccessExpression(expr)) {
        const baseName = expr.getExpression().getText();
        const propName = expr.getName(); // get, post, put, delete
        
        if (baseName === "router" && ["get", "post", "put", "delete"].includes(propName)) {
          const args = callExpr.getArguments();
          const pathArg = args[0];
          
          // Find argument pointing to controller method
          const handlerArg = args.find(arg => {
            return (Node.isPropertyAccessExpression(arg) && arg.getExpression().getText().endsWith("Controller")) ||
                   (Node.isIdentifier(arg) && arg.getText().endsWith("Controller"));
          }) || args[args.length - 1];
          
          if (pathArg && Node.isStringLiteral(pathArg)) {
            const routePath = pathArg.getLiteralValue();
            const fullPath = ("/api/packages" + routePath).replace(/\/+/g, "/").replace(/\/$/, "");
            const apiNodeId = `API:${propName.toUpperCase()}:${fullPath}`;
            
            // Add route mappings from API endpoint to Controller method
            if (handlerArg) {
              const symbol = handlerArg.getSymbol() || typeChecker.getSymbolAtLocation(handlerArg);
              if (symbol) {
                const resolved = getResolvedSymbol(symbol);
                for (const decl of resolved.getDeclarations()) {
                  const targetSymbol = declarationMap.get(decl);
                  if (targetSymbol) {
                    // Ensure API endpoint is registered
                    if (!symbols.some(s => s.id === apiNodeId)) {
                      symbols.push({
                        id: apiNodeId,
                        type: "API",
                        name: `${propName.toUpperCase()} ${fullPath}`,
                        file: filePath,
                        project: "api",
                        startLine: 0,
                        endLine: 0,
                      });
                    }
                    
                    edges.push({
                      source: apiNodeId,
                      target: targetSymbol.id,
                      type: "routes_to",
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// Deduplicate edges
const uniqueEdgesMap = new Map<string, Edge>();
for (const edge of edges) {
  const key = `${edge.source}->${edge.target}:${edge.type}`;
  uniqueEdgesMap.set(key, edge);
}
const uniqueEdges = Array.from(uniqueEdgesMap.values());

// ==========================================
// OUTPUT GENERATION
// ==========================================

const metadata = {
  generatedAt: new Date().toISOString(),
  project: "trouvailler-admin",
  version: "1.0",
  sourceCount: sourceFiles.length,
  symbolCount: symbols.length,
  edgeCount: uniqueEdges.length
};

// 1. dependency-graph.json
const dependencyGraphJson = {
  ...metadata,
  files: files.map(f => ({ path: f.path, project: f.project, imports: f.imports, exports: f.exports })),
  symbols: symbols.map(s => ({ id: s.id, type: s.type, name: s.name, file: s.file, project: s.project, startLine: s.startLine, endLine: s.endLine })),
  edges: uniqueEdges,
};
fs.writeFileSync("dependency-graph.json", JSON.stringify(dependencyGraphJson, null, 2));
console.log("Generated: dependency-graph.json");


// 2. dependency-graph.dot
let dotContent = 'digraph G {\n';
dotContent += '  rankdir=LR;\n';
dotContent += '  node [shape=box, style="filled,rounded", fillcolor="#e0f2fe", color="#0284c7", fontname="Helvetica"];\n';
dotContent += '  edge [fontname="Helvetica", fontsize=9];\n\n';

const fileGroups = new Map<string, SymbolNode[]>();
for (const sym of symbols) {
  if (sym.file !== "node_modules") {
    if (!fileGroups.has(sym.file)) {
      fileGroups.set(sym.file, []);
    }
    fileGroups.get(sym.file)!.push(sym);
  }
}

let clusterIndex = 0;
for (const [filePath, syms] of fileGroups.entries()) {
  const clusterName = `cluster_${clusterIndex++}`;
  dotContent += `  subgraph ${clusterName} {\n`;
  dotContent += `    label="${filePath}";\n`;
  dotContent += '    style="filled,dashed";\n';
  dotContent += '    fillcolor="#fafafa";\n';
  dotContent += '    color="#d1d5db";\n';
  
  for (const sym of syms) {
    let fillColor = "#e0f2fe"; // FUNC default: light blue
    let borderColor = "#0284c7";
    if (sym.type === "COMPONENT") {
      fillColor = "#fef08a"; // COMPONENTS: yellow
      borderColor = "#ca8a04";
    } else if (sym.type === "SCHEMA") {
      fillColor = "#ffedd5"; // SCHEMAS: light orange
      borderColor = "#ea580c";
    } else if (sym.type === "API") {
      fillColor = "#dcfce7"; // APIs: light green
      borderColor = "#16a34a";
    }
    dotContent += `    "${sym.id}" [label="${sym.name}\\n(${sym.type})", fillcolor="${fillColor}", color="${borderColor}"];\n`;
  }
  dotContent += '  }\n\n';
}

// Add edges to DOT file
for (const edge of uniqueEdges) {
  let style = "";
  if (edge.type === "imports") {
    continue; // hide raw imports in visual graph to reduce noise
  } else if (edge.type === "defines") {
    continue; // shown implicitly by clusters
  } else if (edge.type === "calls") {
    style = '[color="#2563eb", label="calls"]';
  } else if (edge.type === "calls_api") {
    style = '[color="#16a34a", style="dashed", label="api_call"]';
  } else if (edge.type === "routes_to") {
    style = '[color="#15803d", penwidth=2, label="routes"]';
  } else if (edge.type === "renders") {
    style = '[color="#ca8a04", style="bold", label="renders"]';
  } else if (edge.type === "uses_hook") {
    style = '[color="#7c3aed", style="dotted", label="hook"]';
  } else if (edge.type === "uses_schema") {
    style = '[color="#ea580c", style="dotted", label="schema"]';
  } else if (edge.type === "references") {
    style = '[color="#9ca3af", style="dashed", label="references"]';
  }
  
  dotContent += `  "${edge.source}" -> "${edge.target}" ${style};\n`;
}
dotContent += '}\n';
fs.writeFileSync("dependency-graph.dot", dotContent);
console.log("Generated: dependency-graph.dot");


// 3. ai-index.json
const aiIndex: Record<string, any> = {};
for (const sym of symbols) {
  const callers = uniqueEdges.filter(e => e.target === sym.id && e.type === "calls").map(e => e.source);
  const renderers = uniqueEdges.filter(e => e.target === sym.id && e.type === "renders").map(e => e.source);
  const references = uniqueEdges.filter(e => e.target === sym.id && e.type === "references").map(e => e.source);
  
  aiIndex[sym.id] = {
    name: sym.name,
    type: sym.type,
    file: sym.file,
    project: sym.project,
    range: { start: sym.startLine, end: sym.endLine },
    callers: callers,
    renders: renderers,
    referencedBy: references,
  };
}
const aiIndexOutput = {
  ...metadata,
  symbols: aiIndex,
};
fs.writeFileSync("ai-index.json", JSON.stringify(aiIndexOutput, null, 2));
console.log("Generated: ai-index.json");


// 4. workspace-graph.json
const projects: Record<string, { folders: string[]; dependencies: string[] }> = {};
const projectFolders = new Map<string, Set<string>>();

for (const ws of workspaces) {
  const fullName = `trouvailler-${ws.name}`;
  projects[fullName] = {
    folders: [],
    dependencies: ws.name === "admin" || ws.name === "frontend" ? ["trouvailler-api"] : [],
  };
  projectFolders.set(ws.name, new Set<string>());
}

for (const f of files) {
  const dir = path.dirname(f.path);
  if (dir !== ".") {
    const wsFolders = projectFolders.get(f.project);
    if (wsFolders) {
      wsFolders.add(dir);
    }
  }
}

for (const ws of workspaces) {
  const fullName = `trouvailler-${ws.name}`;
  projects[fullName].folders = Array.from(projectFolders.get(ws.name) || []);
}

// Build high-level directory/module dependencies
const moduleEdgesMap = new Map<string, { source: string; target: string; type: string }>();
for (const edge of uniqueEdges) {
  let srcFile = "";
  let tgtFile = "";
  
  // Extract file names from symbol IDs
  if (edge.source.includes(":") && !edge.source.startsWith("Router")) {
    srcFile = edge.source.split(":")[1];
  }
  if (edge.target.includes(":")) {
    tgtFile = edge.target.split(":")[1];
  }
  
  if (srcFile && tgtFile && srcFile !== tgtFile) {
    const srcProject = getProjectName(srcFile);
    const tgtProject = getProjectName(tgtFile);
    const srcDir = path.dirname(srcFile);
    const tgtDir = path.dirname(tgtFile);
    
    if (srcDir !== "." && tgtDir !== ".") {
      const srcModule = `${srcProject}:${srcDir}`;
      const tgtModule = `${tgtProject}:${tgtDir}`;
      
      if (srcModule !== tgtModule) {
        const key = `${srcModule}->${tgtModule}:${edge.type}`;
        moduleEdgesMap.set(key, {
          source: srcModule,
          target: tgtModule,
          type: edge.type,
        });
      }
    }
  }
}

const workspaceGraph = {
  ...metadata,
  projects,
  moduleEdges: Array.from(moduleEdgesMap.values()),
};
fs.writeFileSync("workspace-graph.json", JSON.stringify(workspaceGraph, null, 2));
console.log("Generated: workspace-graph.json");

console.log("\nTrouvailler codebase graph generation complete! All 4 visual and machine-readable models constructed successfully.");
