import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { parse } from "@babel/parser";
import { expect, it } from "vitest";

const root = resolve("src");
const layers = ["shared", "features", "widgets", "app"];
function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesIn(resolve(directory, entry.name))
      : /\.tsx?$/.test(entry.name)
        ? [resolve(directory, entry.name)]
        : [],
  );
}
type Node = { type?: string; value?: unknown; source?: Node; [key: string]: unknown };
function walk(node: unknown, visit: (node: Node) => void) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((value) => walk(value, visit));
    return;
  }
  const item = node as Node;
  if (item.type) visit(item);
  Object.entries(item).forEach(([key, value]) => {
    if (
      !["loc", "tokens", "comments", "leadingComments", "trailingComments", "extra"].includes(key)
    )
      walk(value, visit);
  });
}

it("enforces layer direction, feature isolation, API separation and no cycles", () => {
  const files = filesIn(root);
  const graph = new Map<string, string[]>();
  const violations: string[] = [];
  for (const file of files) {
    const source = relative(root, file);
    const [sourceLayer, sourceFeature] = source.split("/");
    const deps: string[] = [];
    const ast = parse(readFileSync(file, "utf8"), {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      createImportExpressions: true,
    });
    walk(ast, (node) => {
      if (
        ![
          "ImportDeclaration",
          "ExportNamedDeclaration",
          "ExportAllDeclaration",
          "ImportExpression",
        ].includes(node.type || "")
      )
        return;
      const path = node.source?.value;
      if (typeof path !== "string") return;
      if (
        file.endsWith("/api.ts") &&
        ["react", "react-router-dom", "react-i18next", "@tanstack/react-query"].includes(path)
      )
        violations.push(`${source}: API imports UI package ${path}`);
      if (!path.startsWith(".") && !path.startsWith("@/")) return;
      const absolute = path.startsWith("@/")
        ? resolve(root, path.slice(2))
        : resolve(dirname(file), path);
      const target = [
        absolute,
        `${absolute}.ts`,
        `${absolute}.tsx`,
        `${absolute}/index.ts`,
        `${absolute}/index.tsx`,
      ].find((candidate) => files.includes(candidate));
      if (!target) return;
      deps.push(target);
      const targetPath = relative(root, target);
      const [targetLayer, targetFeature] = targetPath.split("/");
      if (sourceLayer !== "main.tsx" && layers.indexOf(targetLayer) > layers.indexOf(sourceLayer))
        violations.push(`${source} -> ${targetPath}`);
      if (
        sourceLayer === "features" &&
        targetLayer === "features" &&
        sourceFeature !== targetFeature
      )
        violations.push(`${source}: cross-feature import ${targetPath}`);
      if (
        file.endsWith("/api.ts") &&
        (target.endsWith(".tsx") ||
          targetPath.includes("/ui/") ||
          targetPath.includes("/resources/"))
      )
        violations.push(`${source}: API depends on presentation ${targetPath}`);
    });
    graph.set(file, deps);
  }
  const done = new Set<string>();
  function visit(file: string, stack: string[]) {
    if (stack.includes(file)) {
      violations.push(
        `Cycle: ${[...stack, file].map((path) => relative(root, path)).join(" -> ")}`,
      );
      return;
    }
    if (done.has(file)) return;
    for (const dep of graph.get(file) || []) visit(dep, [...stack, file]);
    done.add(file);
  }
  files.forEach((file) => visit(file, []));
  expect(violations).toEqual([]);
});

it("keeps display copy out of components and feature configurations", () => {
  const violations: string[] = [];
  for (const file of filesIn(root).filter((file) => !file.includes("/i18n/locales/"))) {
    const ast = parse(readFileSync(file, "utf8"), {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
    walk(ast, (node) => {
      if (!["StringLiteral", "JSXText"].includes(node.type || "")) return;
      const value = String(node.value || "").trim();
      if (
        /\p{Script=Han}/u.test(value) ||
        (node.type === "JSXText" &&
          /[a-zA-Z]/.test(value) &&
          !["ABD IM Admin", "ID"].includes(value))
      )
        violations.push(`${relative(root, file)}: ${value}`);
    });
  }
  expect(violations).toEqual([]);
});
