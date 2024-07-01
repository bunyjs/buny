import container, {createDecorator, DecoratorType, Token, useClass, ClassScope, TokenValue} from "@bunyjs/ioc";

interface UsableOptions {
  dependencies?: TokenValue<unknown>[];
  scope?: ClassScope;
}

const usable = createDecorator("usable", (options: UsableOptions = {}) => {
  options.dependencies ??= [];
  options.scope ??= ClassScope.Singleton;

  return {
    apply: [
      DecoratorType.Class,
    ],
    onInit: (context) => {
      context.addDependency(...options.dependencies);
    },
    onBoostrap: async (context) => {
      const token = Token.from(context.target);

      const dependencies = context.getDependency();

      await container.register(token, useClass({
        constructor: context.target,
        scope: options?.scope,
        dependencies,
      }));
    },
  };
});

export {
  usable,
};
