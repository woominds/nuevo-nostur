import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.join(
  PROJECT_ROOT,
  "src"
);

const REPORT_PATH = path.join(
  PROJECT_ROOT,
  ".nostur-orphan-files-report.txt"
);

const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx"
];

function normalizePath(value) {
  return path.resolve(value);
}

function isSourceFile(filePath) {
  return (
    SOURCE_EXTENSIONS.includes(
      path.extname(filePath)
    ) &&
    !filePath.endsWith(".d.ts")
  );
}

function walkFiles(directory) {
  const output = [];

  for (
    const entry of fs.readdirSync(
      directory,
      {
        withFileTypes: true
      }
    )
  ) {
    const fullPath = path.join(
      directory,
      entry.name
    );

    if (entry.isDirectory()) {
      output.push(
        ...walkFiles(fullPath)
      );

      continue;
    }

    if (
      entry.isFile() &&
      isSourceFile(fullPath)
    ) {
      output.push(
        normalizePath(fullPath)
      );
    }
  }

  return output;
}

function resolveRelativeModule(
  sourceFilePath,
  moduleSpecifier
) {
  if (
    typeof moduleSpecifier !== "string" ||
    !moduleSpecifier.startsWith(".")
  ) {
    return null;
  }

  const unresolvedPath = path.resolve(
    path.dirname(sourceFilePath),
    moduleSpecifier
  );

  const candidates = [];

  if (
    SOURCE_EXTENSIONS.includes(
      path.extname(unresolvedPath)
    )
  ) {
    candidates.push(
      unresolvedPath
    );
  } else {
    for (
      const extension of SOURCE_EXTENSIONS
    ) {
      candidates.push(
        `${unresolvedPath}${extension}`
      );
    }

    for (
      const extension of SOURCE_EXTENSIONS
    ) {
      candidates.push(
        path.join(
          unresolvedPath,
          `index${extension}`
        )
      );
    }
  }

  for (
    const candidate of candidates
  ) {
    if (
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      return normalizePath(
        candidate
      );
    }
  }

  return null;
}

function getModuleSpecifiers(
  filePath
) {
  const sourceText = fs.readFileSync(
    filePath,
    "utf8"
  );

  const sourceFile =
    ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx")
        ? ts.ScriptKind.TSX
        : filePath.endsWith(".jsx")
          ? ts.ScriptKind.JSX
          : filePath.endsWith(".js")
            ? ts.ScriptKind.JS
            : ts.ScriptKind.TS
    );

  const specifiers = new Set();

  function visit(node) {
    if (
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node)
    ) {
      const moduleSpecifier =
        node.moduleSpecifier;

      if (
        moduleSpecifier &&
        ts.isStringLiteralLike(
          moduleSpecifier
        )
      ) {
        specifiers.add(
          moduleSpecifier.text
        );
      }
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind ===
        ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      const argument =
        node.arguments[0];

      if (
        ts.isStringLiteralLike(
          argument
        )
      ) {
        specifiers.add(
          argument.text
        );
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(
        node.expression
      ) &&
      node.expression.text ===
        "require" &&
      node.arguments.length === 1
    ) {
      const argument =
        node.arguments[0];

      if (
        ts.isStringLiteralLike(
          argument
        )
      ) {
        specifiers.add(
          argument.text
        );
      }
    }

    ts.forEachChild(
      node,
      visit
    );
  }

  visit(sourceFile);

  return Array.from(
    specifiers
  );
}

if (
  !fs.existsSync(SRC_ROOT)
) {
  throw new Error(
    "No existe la carpeta src."
  );
}

const allFiles =
  walkFiles(SRC_ROOT);

const allFilesSet =
  new Set(allFiles);

const dependencyGraph =
  new Map();

for (
  const filePath of allFiles
) {
  const dependencies =
    new Set();

  for (
    const moduleSpecifier of
      getModuleSpecifiers(
        filePath
      )
  ) {
    const resolved =
      resolveRelativeModule(
        filePath,
        moduleSpecifier
      );

    if (
      resolved &&
      allFilesSet.has(resolved)
    ) {
      dependencies.add(
        resolved
      );
    }
  }

  dependencyGraph.set(
    filePath,
    dependencies
  );
}

const entryCandidates = [
  path.join(
    SRC_ROOT,
    "main.tsx"
  ),
  path.join(
    SRC_ROOT,
    "main.ts"
  ),
  path.join(
    SRC_ROOT,
    "index.tsx"
  ),
  path.join(
    SRC_ROOT,
    "index.ts"
  )
]
  .map(normalizePath)
  .filter(
    (entryPath) =>
      fs.existsSync(entryPath)
  );

if (
  entryCandidates.length === 0
) {
  throw new Error(
    "No se encontró el punto de entrada de la aplicación."
  );
}

const reachable =
  new Set();

const pending = [
  ...entryCandidates
];

while (
  pending.length > 0
) {
  const current =
    pending.pop();

  if (
    !current ||
    reachable.has(current)
  ) {
    continue;
  }

  reachable.add(
    current
  );

  for (
    const dependency of
      dependencyGraph.get(
        current
      ) || []
  ) {
    if (
      !reachable.has(
        dependency
      )
    ) {
      pending.push(
        dependency
      );
    }
  }
}

const orphanCandidates =
  allFiles
    .filter(
      (filePath) =>
        !reachable.has(
          filePath
        )
    )
    .sort()
    .map(
      (filePath) =>
        path.relative(
          PROJECT_ROOT,
          filePath
        )
    );

fs.writeFileSync(
  REPORT_PATH,
  orphanCandidates.join(
    "\n"
  ),
  "utf8"
);

console.log("");
console.log(
  `Archivos analizados: ${allFiles.length}`
);

console.log(
  `Archivos alcanzables desde main: ${reachable.size}`
);

console.log(
  `Candidatos reales a huérfanos: ${orphanCandidates.length}`
);

console.log("");

for (
  const candidate of
    orphanCandidates
) {
  console.log(
    candidate
  );
}

console.log("");
console.log(
  "No se eliminó ningún archivo."
);

console.log(
  "Informe generado en .nostur-orphan-files-report.txt"
);
