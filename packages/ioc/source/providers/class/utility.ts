import Container from "~/domain/container";
import Token, {TokenValue} from "~/domain/token";

import {Constructor} from "~/types/class";

import {parametersMetadata, metadata} from "./metadata";

interface InvokeToken {
  token: TokenValue<unknown>;
}

interface InvokeInstance {
  instance: unknown;
}

interface InvokeConstructor {
  target: Constructor<unknown>;
}

interface InvokeMethod {
  container: Container;
  method: PropertyKey;
  args?: unknown[];
}

type InvokeOptions = InvokeMethod & (InvokeToken | InvokeConstructor | InvokeInstance);

const InvokeConstructor = async (options: InvokeMethod & InvokeConstructor) => {
  let {container, target, method, args} = options;

  args ??= [];

  const parameters = parametersMetadata.get(target, method) ?? [];

  await Promise.all(parameters.map(async (parameter) => {
    args[parameter.index] = await parameter.handler({
      container,
    });
  }));

  const parametersTypes = metadata.getParamTypes(target, method) ?? [];

  await Promise.all(parametersTypes.map(async (type, index) => {
    if (args[index] !== undefined) {
      return;
    }

    const parameterToken = Token.tryFrom(type);

    if (parameterToken) {
      args[index] = container.resolve(type, undefined);
    }
  }));

  return Reflect.apply(target[method], target, args);
};

const InvokeInstance = async (options: InvokeMethod & InvokeInstance) => {
  let {container, instance, method, args} = options;

  args ??= [];

  const parameters = parametersMetadata.get(instance, method) ?? [];

  await Promise.all(parameters.map(async (parameter) => {
    args[parameter.index] = await parameter.handler({
      container,
    });
  }));

  const parametersTypes = metadata.getParamTypes(instance, method) ?? [];

  await Promise.all(parametersTypes.map(async (type, index) => {
    if (args[index] !== undefined) {
      return;
    }

    const parameterToken = Token.tryFrom(type);

    if (parameterToken) {
      args[index] = container.resolve(type, undefined);
    }
  }));

  return Reflect.apply(instance[method], instance, args);
};

const InvokeToken = async (options: InvokeMethod & InvokeToken) => {
  let {container, token, method, args} = options;

  args ??= [];

  const instance = await container.resolve(token);

  const parameters = parametersMetadata.get(instance, method) ?? [];

  await Promise.all(parameters.map(async (parameter) => {
    args[parameter.index] = await parameter.handler({
      container,
    });
  }));

  const parametersTypes = metadata.getParamTypes(instance, method) ?? [];

  await Promise.all(parametersTypes.map(async (type, index) => {
    if (args[index] !== undefined) {
      return;
    }

    const parameterToken = Token.tryFrom(type);

    if (parameterToken) {
      args[index] = container.resolve(type, undefined);
    }
  }));

  return Reflect.apply(instance[method], instance, args);
};

const invoke = async (options: InvokeOptions) => {
  if ("target" in options) {
    return InvokeConstructor(options);
  }

  if ("instance" in options) {
    return InvokeInstance(options);
  }

  if ("token" in options) {
    return InvokeToken(options);
  }

  throw new Error("Invalid invoke options");
};

export {
  invoke,
};
