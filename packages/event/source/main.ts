import {Constructor} from "@bunyjs/ioc";

import {Token, invoke} from "@bunyjs/ioc";

import {usable, use} from "@bunyjs/di";

import Logger from "@bunyjs/logger";

import EventContext from "./domain/context";

interface Dependency {
  constructor: Constructor<unknown>;
  method: string | symbol;
  static: boolean;
  after: Token<unknown>[];
  before: Token<unknown>[];
}

@usable()
class Event {
  @use()
    logger: Logger;

  private sortDependencies = (dependencies: Dependency[]): Dependency[][] => {
    const sorted: Dependency[][] = [];

    for (const dependency of dependencies) {
      if (sorted.length === 0) {
        sorted.push([dependency]);
        continue;
      }

      const beforeIndexes = dependency.before.map((token) => {
        return sorted.findIndex((dependencies) => {
          return dependencies.some((dependency) => {
            return token.match(dependency.constructor);
          });
        });
      }).filter((index) => {
        return index !== -1;
      });

      const afterIndexes = dependency.after.map((token) => {
        return sorted.findIndex((dependencies) => {
          return dependencies.some((dependency) => {
            return token.match(dependency.constructor);
          });
        });
      }).filter((index) => {
        return index !== -1;
      });

      const beforeIndex = Math.min(...beforeIndexes);
      const afterIndex = Math.max(...afterIndexes);

      if (beforeIndex !== Infinity && afterIndex !== -Infinity) {
        if (beforeIndex <= afterIndex) {
          sorted[beforeIndex - 1]!.push(dependency);
          continue;
        }

        if (beforeIndex - 1 === afterIndex) {
          sorted.splice(beforeIndex, 0, [dependency]);
          continue;
        }

        sorted[afterIndex + 1]!.push(dependency);
        continue;
      }

      if (beforeIndex !== Infinity) {
        if (beforeIndex <= 0) {
          sorted.unshift([dependency]);
          continue;
        }

        sorted[beforeIndex - 1]!.push(dependency);
        continue;
      }

      if (afterIndex !== -Infinity) {
        if (afterIndex >= sorted.length - 1) {
          sorted.push([dependency]);
          continue;
        }

        sorted[afterIndex + 1]!.push(dependency);
        continue;
      }

      if (sorted.length) {
        sorted[0]!.push(dependency);
        continue;
      }

      sorted.push([dependency]);
    }

    return sorted;
  };

  invoke = async (context: EventContext) => {
    if (context.registry.size === 0) {
      return;
    }

    const dependencies: Dependency[] = [];

    const entries = context.registry.values();

    for (const constructor of entries) {
      if (!context.container.isRegistered(constructor)) {
        continue;
      }

      const metadatas = context.metadata.get(constructor) ?? [];

      for (const metadata of metadatas) {
        metadata.before ??= [];
        metadata.after ??= [];

        const after = (Array.isArray(metadata.after) ? metadata.after : [metadata.after]).map((token) => {
          return Token.from(token);
        });
        const before = (Array.isArray(metadata.before) ? metadata.before : [metadata.before]).map((token) => {
          return Token.from(token);
        });

        dependencies.push({
          constructor,
          method: metadata.method,
          static: metadata.static,
          after,
          before,
        });
      }
    }

    const sortedDependencies = this.sortDependencies(dependencies);

    for (const dependencies of sortedDependencies) {
      await Promise.all(dependencies.map(async (dependency) => {
        if (dependency.static) {
          return invoke({
            target: dependency.constructor,
            method: dependency.method,
            container: context.container,
          });
        }

        return invoke({
          token: dependency.constructor,
          method: dependency.method,
          container: context.container,
        });
      }));
    }
  };
}

export * from "./domain/context";

export {
  EventContext,
};

export default Event;
