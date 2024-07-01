enum Mode {
  Development = "development",
  Production = "production",
  Test = "test",
}

class ExtendableConfig {
  mode?: Mode;

  constructor(config?: ExtendableConfig) {
    switch (process.env.NODE_ENV) {
      case Mode.Development:
      case Mode.Production:
      case Mode.Test:
        this.mode = process.env.NODE_ENV;
        break;
      default:
        this.mode = Mode.Development;
    }

    Reflect.ownKeys(config ?? {}).forEach((key) => {
      this[key] = config[key];
    });
  }
}

class Config extends ExtendableConfig {
  [key: string | symbol]: any;

  get<Key extends keyof this>(key: Key, defaultValue?: this[Key]) {
    return (Reflect.get(this, key) ?? defaultValue) as this[Key];
  }

  set<Key extends keyof this>(key: Key, value: this[Key]) {
    Reflect.set(this, key, value);
  }

  getEnv<Key extends string>(key: Key, defaultValue?: Key) {
    return (Reflect.get(process.env, key) ?? defaultValue) as Key;
  }

  setEnv<Key extends string, Value extends string>(key: Key, value: Value) {
    Reflect.set(process.env, key, value);
  }

  update(config?: ExtendableConfig) {
    Reflect.ownKeys(config ?? {}).forEach((key) => {
      this[key] = config[key];
    });
  }
}

export {
  Mode,
};

export {
  ExtendableConfig,
};

export default Config;
