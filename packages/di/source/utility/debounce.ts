import {createDecorator, DecoratorType} from "@bunyjs/ioc";

const debounce = createDecorator("debounce", (ms?: number) => {
  return {
    apply: [
      DecoratorType.Method,
      DecoratorType.StaticMethod,
    ],
    onInit(context) {
      let timeout: any;

      const defaultFunction = context.descriptor.value;

      context.descriptor.value = function (...args: any[]) {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
          defaultFunction.apply(this, args);
        }, ms);
      };
    },
  };
});

export {
  debounce,
};
