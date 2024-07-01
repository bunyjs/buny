import {createDecorator, DecoratorType} from "@bunyjs/ioc";

const delay = createDecorator("delay", (ms?: number) => {
  return {
    apply: [
      DecoratorType.Method,
      DecoratorType.StaticMethod,
    ],
    onInit(context) {
      const defaultFunction = context.descriptor.value;

      context.descriptor.value = function (...args: any[]) {
        setTimeout(() => {
          defaultFunction.apply(this, args);
        }, ms);
      };
    },
  };
});

export {
  delay,
};
