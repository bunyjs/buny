import Provider, {ProviderConfig, ProviderContext} from "~/domain/provider";

import Container from "~/domain/container";

enum FactoryScope {
  Repeated = "repeated",
  Once = "once",
}

interface FactoryContext<Value> extends ProviderContext<Value> {
  factory: (container: Container) => Promise<Value> | Value;
  scope: FactoryScope;
  provider: FactoryProvider<Value>;
}

interface FactoryValueContext<Value> extends FactoryContext<Value> {
  value: Value;
}

interface FactoryConfig<Value> extends ProviderConfig<Value> {
  factory: (container: Container) => Promise<Value> | Value;
  scope?: FactoryScope;
  onRegister?: (context: FactoryContext<Value>) => Promise<void> | void;
  onResolve?: (context: FactoryContext<Value>) => Promise<void> | void;
  whenResolved?: (context: FactoryValueContext<Value>) => Promise<void> | void;
  onDispose?: (context: FactoryContext<Value>) => Promise<void> | void;
  whenDisposed?: (context: FactoryValueContext<Value>) => Promise<void> | void;
  onDestroy?: (context: FactoryContext<Value>) => Promise<void> | void;
}

class FactoryProvider<Value> extends Provider<Value, FactoryConfig<Value>> {
  private value?: Value;

  get context(): FactoryContext<Value> {
    return {
      factory: this.config.factory,
      scope: this.config.scope ?? FactoryScope.Repeated,
      token: this.token,
      dependencies: this.dependencies,
      container: this.container,
      provider: this,
    };
  }

  constructor(config: FactoryConfig<Value>) {
    super(config);
  }

  register = async () => {
    await this.config.onRegister?.(this.context);
  };

  resolve = async () => {
    await this.config.onResolve?.(this.context);

    if (this.value) {
      return this.value;
    }

    const value = await this.config.factory(this.container);

    switch (this.config.scope) {
      case FactoryScope.Once:
        this.value = value;
        break;
    }

    await this.config.whenResolved?.({
      ...this.context,
      value,
    });

    return value;
  };

  dispose = async () => {
    await this.config.onDispose?.(this.context);

    if (this.value) {
      await this.config.whenDisposed?.({
        ...this.context,
        value: this.value,
      });
    }

    this.value = undefined;
  };

  destroy = async () => {
    await this.config.onDestroy?.(this.context);
  };
}

const useFactory = <Value>(provider: FactoryConfig<Value>) => {
  return new FactoryProvider(provider);
};

export type {
  FactoryContext,
  FactoryValueContext,
  FactoryConfig,
};

export {
  FactoryScope,
};

export {
  useFactory,
};
