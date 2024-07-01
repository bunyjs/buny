import Provider, {ProviderConfig, ProviderContext} from "~/domain/provider";

interface ValueContext<Value> extends ProviderContext<Value> {
  value: Value;
  provider: ValueProvider<Value>;
}

interface ValueConfig<Value> extends ProviderConfig<Value> {
  value: Value;
  onRegister?: (context: ValueContext<Value>) => Promise<void> | void;
  onResolve?: (context: ValueContext<Value>) => Promise<void> | void;
  onDispose?: (context: ValueContext<Value>) => Promise<void> | void;
  onDestroy?: (context: ValueContext<Value>) => Promise<void> | void;
}

class ValueProvider<Value> extends Provider<Value, ValueConfig<Value>> {
  constructor(config: ValueConfig<Value>) {
    super(config);
  }

  get context(): ValueContext<Value> {
    return {
      value: this.config.value,
      token: this.token,
      dependencies: this.dependencies,
      container: this.container,
      provider: this,
    };
  }

  register = async () => {
    await this.config.onRegister?.(this.context);
  };

  resolve = async () => {
    await this.config.onResolve?.(this.context);
    return this.config.value;
  };

  dispose = async () => {
    await this.config.onDispose?.(this.context);
  };

  destroy = async () => {
    await this.config.onDestroy?.(this.context);
  };
}

const useValue = <Value>(provider: ValueConfig<Value>) => {
  return new ValueProvider(provider);
};

export type {
  ValueContext,
  ValueConfig,
};

export {
  ValueProvider,
};

export {
  useValue,
};
