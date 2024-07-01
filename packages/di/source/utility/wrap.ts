import {createDecorator} from "@bunyjs/ioc";

const wrap = createDecorator("wrap", (decorators: any[]) => ({
  onInit: (context) => {
    decorators.forEach((decorator) => {
      decorator(context.target, context.propertyKey, context.descriptor);
    });
  },
}));

export {
  wrap,
};
