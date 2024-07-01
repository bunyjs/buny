import {createDecorator, TokenValue, DecoratorType, Token, metadata} from "@bunyjs/ioc";

import {isOptional} from "./optional";

const use = createDecorator("use", (token?: TokenValue<unknown>) => {
  return {
    apply: [
      DecoratorType.Property,
      DecoratorType.StaticProperty,
      DecoratorType.Parameter,
    ],
    onInit(context) {
      const resolveProperty = () => {
        if (!token) {
          const propertyType = metadata.getType(context.target, context.propertyKey);

          if (!propertyType) {
            return;
          }

          token = Token.from(propertyType);
        }

        context.addDependency(token);

        context.defineProperty(({container}) => {
          if (isOptional(context.target, context.propertyKey)) {
            return container.resolve(token!, undefined);
          }

          return container.resolve(token!);
        });
      };
      const resolveParameter = () => {
        if (!token) {
          const parameterTypes = metadata.getParamTypes(context.target, context.propertyKey);

          if (!parameterTypes) {
            return;
          }

          const parameterType = parameterTypes.at(context.descriptor);

          if (!parameterType) {
            return;
          }

          token = Token.from(parameterType);
        }

        context.addDependency(token);

        context.defineParameter(({container}) => {
          if (isOptional(context.target, context.propertyKey)) {
            return container.resolve(token!, undefined);
          }

          return container.resolve(token!);
        });
      };

      if (context.type === DecoratorType.Parameter) {
        return resolveParameter();
      }

      resolveProperty();
    },
  };
});

export {
  use,
};
