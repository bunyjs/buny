import Container from "~/domain/container";
import Token, {TokenValue} from "~/domain/token";

interface ProviderContext<Value> {
  container: Container;
  provider: Provider<Value>;
  token: Token<Value>;
  dependencies: Token<unknown>[];
}

interface ProviderConfig<Value> {
  token?: TokenValue<Value>;
  dependencies?: TokenValue<unknown>[];
}

abstract class Provider<Value = unknown, Config extends ProviderConfig<Value> = ProviderConfig<Value>> {
  config: Config;

  container: Container;

  protected constructor(config: Config) {
    this.config = config;
  }

  get token() {
    if (this.config.token) {
      return Token.from(this.config.token);
    }

    throw new Error("Token is not defined");
  }

  get dependencies() {
    const dependencies = this.config.dependencies || [];
    return dependencies.map((dependency) => Token.from(dependency));
  }

  abstract register(): Promise<void>;

  abstract resolve(): Promise<Value>;

  abstract dispose(): Promise<void>;

  abstract destroy(): Promise<void>;
}

export type {
  ProviderContext,
  ProviderConfig,
};

export default Provider;
