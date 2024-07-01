import {execaNode, ResultPromise} from "execa";

import {findDir, normalize, createFilter} from "rosetil";
import {PackageJson, loadPackage, TsConfig, loadTsConfig, loadDotenv} from "roserc";

import {rollup, watch, RollupOptions, OutputOptions, RollupWatcher, RollupBuild} from "rollup";

import nodeResolvePlugin from "@rollup/plugin-node-resolve";
import commonjsPlugin from "@rollup/plugin-commonjs";
import jsonPlugin from "@rollup/plugin-json";

import swcPlugin from "./plugins/swc";
import {globImporter} from "./plugins/importer";

import {builtinModules} from "module";
import path from "path";
import fs from "fs";

interface BunyConfig {
  mode: "development" | "production";
}

class Buny {
  cwd: string;

  config: BunyConfig;
  packageJson: PackageJson;
  tsConfig: TsConfig;
  dotenv: Record<string, string>;

  private get input() {
    const main = this.packageJson.main;

    if (!main) {
      throw new Error("No main file in package.json");
    }

    return path.join(this.cwd, main);
  }

  private get output() {
    return path.join(this.cwd, "dist", "app.mjs");
  }

  constructor(config: BunyConfig) {
    this.config = config;
  }

  private get rollupOptions(): RollupOptions {
    const external = createFilter({
      include: [
        RegExp("^@buny"),
        ...builtinModules.flatMap((module) => [
          module,
          `node:${module}`,
        ]),
        ...Object.keys(this.packageJson.dependencies ?? {}),
        ...Object.keys(this.packageJson.devDependencies ?? {}),
        ...Object.keys(this.packageJson.peerDependencies ?? {}),
      ],
      default: true,
    });

    return {
      input: this.input,
      plugins: [
        nodeResolvePlugin({
          rootDir: this.cwd,
          extensions: [".js", ".mjs", "cjs", ".ts", ".mts", ".cts", ".jsx", ".tsx", ".json", ".node"],
          preferBuiltins: true,
          browser: false,
        }),
        commonjsPlugin({
          extensions: [".js", ".mjs", "cjs", ".ts", ".mts", ".cts", ".jsx", ".tsx", ".json", ".node"],
          transformMixedEsModules: true,
          include: /\/node_modules\//,
          sourceMap: false,
        }),
        jsonPlugin({
          preferConst: true,
        }),
        swcPlugin({
          cwd: this.cwd,
          options: {
            cwd: this.cwd,
            root: this.cwd,
            sourceRoot: this.cwd,
            jsc: {
              externalHelpers: false,
              minify: {
                keep_classnames: true,
              },
              parser: {
                syntax: "typescript",
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                useDefineForClassFields: false,
              },
              target: "esnext",
            },
            module: {
              type: "es6",
            },
            isModule: true,
            configFile: false,
            swcrc: false,
          },
          tsConfig: this.tsConfig,
        }),
        globImporter(),
      ],
      external: (source, importer) => {
        if (!importer) {
          return false;
        }

        return external(source);
      },
    };
  }

  private get outputOptions(): OutputOptions {
    return {
      file: this.output,
      format: "esm",
      generatedCode: {
        preset: "es2015",
        arrowFunctions: true,
        constBindings: true,
        objectShorthand: true,
        reservedNamesAsProps: true,
        symbols: true,
      },
    };
  }

  builder: RollupBuild;

  private build = async () => {
    this.builder = await rollup(this.rollupOptions);

    await this.builder.write(this.outputOptions);

    await this.start();
  };

  watcher: RollupWatcher;

  private watch = () => {
    this.watcher = watch({
      ...this.rollupOptions,
      output: this.outputOptions,
    });

    this.watcher.on("event", async (event) => {
      if (event.code === "BUNDLE_END") {
        await this.start();
      }
    });
  };

  init = async () => {
    const cwd = await findDir({
      name: "package.json",
    });

    if (!cwd) {
      throw new Error("Could not find package.json");
    }

    this.cwd = normalize(cwd);

    this.packageJson = await loadPackage(cwd);
    this.tsConfig = await loadTsConfig(cwd);

    this.dotenv = {};

    const dotenvFiles = [
      ".env",
      ".env.local",
    ];

    if (this.config.mode === "development") {
      dotenvFiles.push(".env.development");
      dotenvFiles.push(".env.dev");
    } else {
      dotenvFiles.push(".env.production");
      dotenvFiles.push(".env.prod");
    }

    for (const file of dotenvFiles.filter(fs.existsSync)) {
      const env = await loadDotenv(file);
      Object.assign(this.dotenv, env);
    }
  };

  private app: ResultPromise;

  private start = async () => {
    if (this.app) {
      this.app.removeAllListeners("exit");
      this.app.kill("SIGKILL");
    }

    this.app = execaNode(this.output, {
      cwd: this.cwd,
      extendEnv: true,
      stdio: "inherit",
      cleanup: true,
      env: {
        FORCE_COLOR: "true",
        NODE_ENV: this.config.mode,
        ...this.dotenv,
      },
    });

    this.app.on("exit", async (code, signal) => {
      if (this.config.mode === "development") {
        return console.error("App exited with code", code ?? 1, "and signal", signal ?? "none");
      }

      if (this.builder) {
        await this.builder.close();
      }

      if (this.watcher) {
        await this.watcher.close();
      }

      if (code) {
        process.exit(code);
      }

      if (signal) {
        process.exit(1);
      }

      process.exit(0);
    });
  };

  run = async () => {
    if (this.config.mode === "production") {
      return this.build();
    }

    return this.watch();
  };
}

export type {
  BunyConfig,
};

export default Buny;
