import Emitter from "./emitter";
import Provider from "./provider";
import Store from "./store";
import Token, {TokenValue, TokenId} from "./token";

class Container extends Emitter {
  private store = new Store();

  //

  private parent: Container | null;
  private children: Container[] = [];

  //

  createScope(): Container {
    const child = new Container();
    this.children.push(child);
    child.parent = this;
    return child;
  }

  //

  boostrap = async () => {
    await this.emitSerial("boostrap", {
      container: this,
    });
  };

  //

  isRegistered = <Value>(value: TokenValue<Value>): boolean => {
    const token = Token.from<Value>(value);

    const pointer = this.store.getToken(token);

    if (pointer) {
      if (pointer.type === "provider") {
        return true;
      }

      if (pointer.type === "mapper") {
        const tokens = Array.isArray(pointer.token) ? pointer.token : [pointer.token];

        return tokens.some((token) => this.isRegistered(token));
      }
    }

    if (this.parent) {
      return this.parent.isRegistered(token);
    }

    return false;
  };

  findCircularRegistration = <Value>(value: TokenValue<Value>, provider: Provider<Value>, visited: TokenId[] = []) => {
    const token = Token.from<Value>(value);

    if (visited.includes(token.id)) {
      visited.push(token.id);
      throw new Error(`Circular binding detected: ${visited.map((id) => Token.from(id).toString()).join(" -> ")}`);
    }

    visited.push(token.id);

    for (let dependencyToken of provider.dependencies) {
      const provider = this.use(dependencyToken, null);

      if (!provider) {
        continue;
      }

      this.findCircularRegistration(dependencyToken, provider, structuredClone(visited));

      if (this.parent) {
        this.parent.findCircularRegistration(dependencyToken, provider, structuredClone(visited));
      }
    }
  };

  register = async <Value>(value: TokenValue<Value> | Provider<Value>, provider?: Provider<Value>) => {
    const token = Token.from<Value>(value);

    await this.emit("register", {
      container: this,
      token,
    });

    if (value instanceof Provider) {
      provider = value;
    }

    if (!provider) {
      throw new Error(`Provider not specified, received ${provider}`);
    }

    if (this.store.hasToken(token)) {
      throw new Error(`Token ${token} is already registered`);
    }

    this.store.setToken(token, {
      type: "provider",
      provider,
    });

    this.findCircularRegistration(token, provider);

    provider.config.token = token;
    provider.container = this;
    await provider.register();

    await this.emit("registered", {
      container: this,
      provider,
      token,
    });

    return this;
  };

  registerMany = async <Value>(value: TokenValue<Value> | Provider<Value>, providers?: Provider<Value> | Provider<Value>[]) => {
    const token = Token.from(value);

    await this.emit("register", {
      container: this,
      token,
    });

    if (value instanceof Provider) {
      providers = value;
    }

    if (!providers) {
      throw new Error(`Provider not specified, received ${providers}`);
    }

    providers = (Array.isArray(providers) ? providers : [providers]).filter(Boolean);

    if (!providers.length) {
      throw new Error("You must provide at least one provider");
    }

    const existing = this.store.getToken(token);

    if (existing) {
      if (existing.type !== "provider") {
        throw new Error(`Token ${token.toString()} is already registered as ${existing.type}`);
      }

      if (!Array.isArray(existing.provider)) {
        throw new Error(`Token ${token.toString()} is already registered`);
      }

      existing.provider.push(...providers);
    } else {
      this.store.setToken(token, {
        type: "provider",
        provider: providers,
      });
    }

    for (const provider of providers) {
      this.findCircularRegistration(token, provider);

      provider.config.token = token;
      provider.container = this;
      await provider.register();

      await this.emit("registered", {
        container: this,
        provider,
        token,
      });
    }

    return this;
  };

  //

  isMapped = <Value>(value: TokenValue<Value>, target: TokenValue<Value> | TokenValue<Value>[]): boolean => {
    const token = Token.from<Value>(value);

    const targets = Array.isArray(target) ? target : [target];

    const pointer = this.store.get(token.id);

    if (pointer) {
      if (pointer.type === "mapper") {
        const tokens = Array.isArray(pointer.token) ? pointer.token : [pointer.token];

        return tokens.some((token) => {
          return targets.some((target) => {
            return token.match(target);
          });
        });
      }
    }

    if (this.parent) {
      return this.parent.isMapped(token, target);
    }

    return false;
  };

  findCircularMapping = <Value>(value: TokenValue<Value>, target: TokenValue<Value>, visited: TokenId[] = []) => {
    const token = Token.from<Value>(value);

    target = Token.from(target);

    if (visited.includes(token.id)) {
      visited.push(token.id);
      throw new Error(`Circular mapping detected: ${visited.map((id) => Token.from(id).toString()).join(" -> ")}`);
    }

    visited.push(token.id);

    const pointer = this.store.getToken(token);

    if (pointer) {
      if (pointer.type === "mapper") {
        const tokens = Array.isArray(pointer.token) ? pointer.token : [pointer.token];

        for (const token of tokens) {
          this.findCircularMapping(token, target, structuredClone(visited));

          if (this.parent) {
            this.parent.findCircularMapping(token, target, structuredClone(visited));
          }
        }
      }
    }
  };

  map = <Value>(value: TokenValue<Value>, target: TokenValue<Value>) => {
    const token = Token.from<Value>(value);

    target = Token.from(target);

    if (this.store.has(token.id)) {
      throw new Error(`Token ${token.toString()} already mapped`);
    }

    this.store.setToken(token, {
      type: "mapper",
      token: target,
    });

    this.findCircularMapping(token, target);
  };

  mapMany = <Value>(value: TokenValue<Value>, target: TokenValue<unknown> | TokenValue<unknown>[]) => {
    const token = Token.from<Value>(value);

    const targets = (Array.isArray(target) ? target : [target]).map((target) => {
      return Token.from(target);
    });

    const existing = this.store.get(token.id);

    if (existing) {
      if (existing.type !== "mapper") {
        throw new Error(`Token ${token.toString()} is already registered as ${existing.type}`);
      }

      if (!Array.isArray(existing.token)) {
        throw new Error(`Token ${token.toString()} is already registered`);
      }

      existing.token.push(...targets);
    } else {
      this.store.set(token.id, {
        type: "mapper",
        token: targets,
      });
    }
  };

  //

  use = <Value>(value: TokenValue<Value>, ...fallback: any): Provider<Value> => {
    const token = Token.from(value);

    const pointer = this.store.getToken(token);

    if (pointer) {
      if (pointer.type === "provider") {
        if (Array.isArray(pointer.provider)) {
          throw new Error(`Token ${token.toString()} is registered as array`);
        }

        return pointer.provider as Provider<Value>;
      }

      if (pointer.type === "mapper") {
        const target = pointer.token;

        if (Array.isArray(target)) {
          throw new Error(`Token ${token.toString()} is mapped as array`);
        }

        return this.use(target) as Provider<Value>;
      }
    }

    if (this.parent) {
      return this.parent.use(token, fallback);
    }

    if (fallback.length) {
      if (fallback.length === 1) {
        return fallback[0];
      }

      return fallback;
    }

    throw new Error(`Token ${token.toString()} is not registered`);
  };

  useMany = <Value>(value: TokenValue<Value>): Provider<Value>[] => {
    const token = Token.from(value);

    const pointer = this.store.get(token.id);

    if (pointer) {
      if (pointer.type === "provider") {
        const provider = pointer.provider;
        return (Array.isArray(provider) ? provider : [provider]) as Provider<Value>[];
      }

      if (pointer.type === "mapper") {
        const target = pointer.token;

        if (Array.isArray(target)) {
          return target.map((target) => this.useMany(target)).flat() as Provider<Value>[];
        }

        return this.useMany(target) as Provider<Value>[];
      }
    }

    if (this.parent) {
      return this.parent.useMany(token);
    }

    throw new Error(`Token ${token.toString()} is not registered`);
  };

  //

  resolve = async <Value>(value: TokenValue<Value>, ...fallback: any): Promise<Value> => {
    const token = Token.from<Value>(value);

    await this.emit("resolve", {
      container: this,
      token,
    });

    const pointer = this.store.getToken(token);

    if (pointer) {
      if (pointer.type === "provider") {
        const provider = pointer.provider;

        if (Array.isArray(provider)) {
          return await Promise.all(provider.map(async (provider) => {
            const value = await provider.resolve();

            await this.emit("resolved", {
              container: this,
              provider,
              token,
              value,
            });

            return value;
          })) as Value;
        }

        const value = await provider.resolve();

        await this.emit("resolved", {
          container: this,
          provider,
          token,
          value,
        });

        return value as Value;
      }

      if (pointer.type === "mapper") {
        const token = pointer.token;

        if (Array.isArray(token)) {
          const values = await Promise.all(token.map((token) => {
            return this.resolve(token, ...fallback);
          }));

          return values as Value;
        }

        return this.resolve<Value>(token, ...fallback);
      }
    }

    if (this.parent) {
      return this.parent.resolve(token, ...fallback);
    }

    if (fallback.length) {
      if (fallback.length === 1) {
        return fallback[0];
      }

      return fallback;
    }

    throw new Error(`Token ${token.toString()} is not registered`);
  };

  //

  dispose = async <Value>(value: TokenValue<Value>) => {
    const token = Token.from(value);

    await this.emit("dispose", {
      container: this,
      token,
    });

    const pointer = this.store.get(token.id);

    if (pointer) {
      if (pointer.type === "provider") {
        const providers = Array.isArray(pointer.provider) ? pointer.provider : [pointer.provider];

        await Promise.all(providers.map(async (provider) => {
          await provider.dispose();
          await this.emit("disposed", {
            container: this,
            provider,
            token,
          });
        }));
      } else if (pointer.type === "mapper") {
        const tokens = Array.isArray(pointer.token) ? pointer.token : [pointer.token];

        await Promise.all(tokens.map((token) => {
          return this.dispose(token);
        }));
      }
    }

    if (this.parent) {
      await this.parent.dispose(token);
    }
  };

  disposeAll = async () => {
    for (const token of this.store.keys()) {
      await this.dispose(token);
    }

    await Promise.all(this.children.map((child) => child.disposeAll()));
  };

  //

  destroy = async <Value>(value: TokenValue<Value>) => {
    const token = Token.from(value);

    await this.emit("destroy", {
      container: this,
      token,
    });

    const pointer = this.store.get(token.id);

    if (pointer) {
      if (pointer.type === "provider") {
        const providers = Array.isArray(pointer.provider) ? pointer.provider : [pointer.provider];

        await Promise.all(providers.map(async (provider) => {
          await provider.destroy();
          await this.emit("destroyed", {
            container: this,
            provider,
            token,
          });
        }));
      } else if (pointer.type === "mapper") {
        const tokens = Array.isArray(pointer.token) ? pointer.token : [pointer.token];

        await Promise.all(tokens.map((token) => {
          return this.destroy(token);
        }));
      }

      this.store.delete(token.id);
    }

    if (this.parent) {
      await this.parent.destroy(token);
    }
  };

  destroyAll = async () => {
    await this.disposeAll();

    for (const token of this.store.keys()) {
      await this.destroy(token);
    }

    if (this.parent) {
      this.parent.children = this.parent.children.filter((child) => child !== this);
      this.parent = null;
    }

    await Promise.all(this.children.map((child) => child.destroyAll()));

    this.store.clear();
  };
}

export default Container;
