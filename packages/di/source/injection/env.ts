import {createDecorator, DecoratorType, metadata} from "@bunyjs/ioc";

import {isOptional} from "./optional";

type Type = String | Number | Boolean | Array<unknown> | Object | Function | unknown;

const parseValue = (value: string | undefined, type?: Type) => {
  if (value === undefined) {
    return undefined;
  }

  if (type === undefined) {
    return value;
  }

  if (type === String) {
    return String(value);
  }

  if (type === Number) {
    return Number(value);
  }

  if (type === Boolean) {
    const truthy = ["true", "1", "yes", "on", "enabled"];
    return truthy.includes(value.toLowerCase());
  }

  if (type === Array) {
    if (value.includes(",")) {
      return value.split(",").map((item) => item.trim());
    }

    if (value.includes(";")) {
      return value.split(";").map((item) => item.trim());
    }

    if (value.includes(" ")) {
      return value.split(" ").map((item) => item.trim());
    }
  }

  return JSON.parse(value);
};

const env = createDecorator("Env", (name?: string) => ({
  apply: [
    DecoratorType.Property,
    DecoratorType.StaticProperty,
    DecoratorType.Parameter,
  ],
  onInit(context) {
    const optional = isOptional(context.target, context.propertyKey, context.descriptor);

    if (context.type === DecoratorType.Parameter) {
      return context.defineParameter(() => {
        const variable = Reflect.get(process.env, name);

        const type = metadata.getParamTypes(context.target, context.propertyKey)?.[context.descriptor];

        if (!optional && variable === undefined) {
          throw new Error(`${context.displayName} ${context.displayPath} | Environment variable "${name}" is undefined.`);
        }

        return parseValue(variable, type);
      });
    }

    context.defineProperty(() => {
      const variable = Reflect.get(process.env, name);

      const type = metadata.getType(context.target, context.propertyKey);

      if (!optional && variable === undefined) {
        throw new Error(`${context.displayName} ${context.displayPath} | Environment variable "${name}" is undefined.`);
      }

      return parseValue(variable, type);
    });
  },
}));

export {
  env,
};
