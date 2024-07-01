import Provider, {ProviderConfig, ProviderContext} from "~/domain/provider";
import Token from "~/domain/token";

import {Constructor} from "~/types/class";

import {registerMetadata, disposeMetadata, destroyMetadata, resolveMetadata, propertiesMetadata, parametersMetadata, metadata} from "./metadata";

enum ClassScope {
  Singleton = "singleton",
  Transient = "transient",
}

interface ClassInstanceContext<Value> extends ClassContext<Value> {
  instance: Value;
}

interface ClassContext<Value> extends ProviderContext<Value> {
  constructor: Constructor<Value>;
  scope: ClassScope;
}

interface ClassConfig<Value> extends ProviderConfig<Value> {
  constructor: Constructor<Value>;
  create?: () => Promise<Value> | Value;
  scope?: ClassScope;
  onRegister?: (context: ClassContext<Value>) => Promise<void> | void;
  onResolve?: (context: ClassContext<Value>) => Promise<void> | void;
  whenResolved?: (context: ClassInstanceContext<Value>) => Promise<void> | void;
  onDispose?: (context: ClassContext<Value>) => Promise<void> | void;
  whenDisposed?: (context: ClassInstanceContext<Value>) => Promise<void> | void;
  onDestroy?: (context: ClassContext<Value>) => Promise<void> | void;
}

class ClassProvider<Value extends Object> extends Provider<Value, ClassConfig<Value>> {
  singletonInstance: Value;
  transientInstances: Value[] = [];

  get context(): ClassContext<Value> {
    return {
      constructor: this.config.constructor,
      scope: this.config.scope ?? ClassScope.Singleton,
      token: this.token,
      dependencies: this.dependencies,
      container: this.container,
      provider: this,
    };
  }

  constructor(config: ClassConfig<Value>) {
    super(config);
  }

  get token(): Token<Value> {
    if (this.config.token) {
      return Token.from(this.config.token);
    }

    return Token.from(this.config.constructor);
  }

  register = async () => {
    await this.config.onRegister?.(this.context);

    const {constructor} = this.config;

    const registers = registerMetadata.get(constructor) ?? [];

    await Promise.all(registers.map(async (register) => {
      await register.handler({
        container: this.container,
      });
    }));
  };

  resolve = async () => {
    await this.config.onResolve?.(this.context);

    if (this.singletonInstance) {
      return this.singletonInstance;
    }

    const {constructor} = this.config;

    const staticProperties = propertiesMetadata.get(constructor) ?? [];

    await Promise.all(staticProperties.map(async (property) => {
      const value = await property.handler({
        container: this.container,
      });

      Reflect.set(constructor, property.key, value);
    }));

    const staticResolves = resolveMetadata.get(constructor) ?? [];

    await Promise.all(staticResolves.map(async (resolve) => {
      return resolve.handler({
        container: this.container,
        instance: undefined,
      });
    }));

    let instance: Value;

    if (this.config.create) {
      instance = await this.config.create();
    } else {
      const args: unknown[] = [];

      const parameters = parametersMetadata.get(constructor) ?? [];

      await Promise.all(parameters.map(async (parameter) => {
        args[parameter.index] = await parameter.handler({
          container: this.container,
        });
      }));

      const instanceParameters = metadata.getParamTypes(constructor) ?? [];

      await Promise.all(instanceParameters.map(async (parameter, index) => {
        if (parameters.some((parameter) => parameter.index === index)) {
          return;
        }

        args[index] = await this.container.resolve(parameter, undefined);
      }));

      instance = new constructor(...args);
    }

    const instanceProperties = propertiesMetadata.get(instance) || [];

    await Promise.all(instanceProperties.map(async (property) => {
      const value = await property.handler({
        container: this.container,
      });

      Reflect.set(instance, property.key, value);
    }));

    const instanceResolves = resolveMetadata.get(instance) ?? [];

    await Promise.all(instanceResolves.map(async (resolve) => {
      return resolve.handler({
        container: this.container,
        instance,
      });
    }));

    switch (this.config.scope) {
      case ClassScope.Transient:
        this.transientInstances = [...this.transientInstances, instance];
        break;
      default:
        this.singletonInstance = instance;
        break;
    }

    await this.config.whenResolved?.({
      ...this.context,
      instance,
    });

    return instance;
  };

  dispose = async () => {
    await this.config.onDispose?.(this.context);

    const {constructor} = this.config;

    const staticDisposers = disposeMetadata.get(constructor) ?? [];

    await Promise.all(staticDisposers.map(async (disposer) => {
      return disposer.handler({
        container: this.container,
        instance: undefined,
      });
    }));

    if (this.singletonInstance) {
      await this.config.whenDisposed?.({
        ...this.context,
        instance: this.singletonInstance,
      });

      const instanceDisposers = disposeMetadata.get(this.singletonInstance) ?? [];

      await Promise.all(instanceDisposers.map(async (disposer) => {
        return disposer.handler({
          container: this.container,
          instance: this.singletonInstance,
        });
      }));
    }

    for (const transientInstance of this.transientInstances) {
      await this.config.whenDisposed?.({
        ...this.context,
        instance: transientInstance,
      });

      const instanceDisposers = disposeMetadata.get(transientInstance) ?? [];

      await Promise.all(instanceDisposers.map(async (disposer) => {
        return disposer.handler({
          container: this.container,
          instance: transientInstance,
        });
      }));
    }

    this.singletonInstance = undefined;
    this.transientInstances = [];
  };

  destroy = async () => {
    await this.config.onDestroy?.({
      constructor: this.config.constructor,
      scope: this.config.scope ?? ClassScope.Singleton,
      token: this.token,
      dependencies: this.dependencies,
      container: this.container,
      provider: this,
    });

    const {constructor} = this.config;

    const staticDestroyers = destroyMetadata.get(constructor) ?? [];

    await Promise.all(staticDestroyers.map(async (destroyer) => {
      return destroyer.handler({
        container: this.container,
      });
    }));
  };
}

const useClass = <Value>(options: ClassConfig<Value>) => {
  return new ClassProvider<Value>({
    scope: ClassScope.Singleton,
    ...options,
  });
};

export {
  ClassScope,
};

export type {
  ClassConfig,
};

export {
  useClass,
};

export default ClassProvider;
