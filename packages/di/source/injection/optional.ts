import {createDecorator, createMetadata, DecoratorType, Token} from "@bunyjs/ioc";

interface OptionalMetadata {
  index: number[];
}

const optionalToken = Token.create("optional");

const optionalMetadata = createMetadata<OptionalMetadata>(optionalToken);

const isOptional = (target: any, propertyKey: string | symbol, descriptor?: number) => {
  const metadata = optionalMetadata.get(target, propertyKey);

  if (metadata === undefined) {
    return false;
  }

  if (descriptor === undefined) {
    return true;
  }

  return metadata.index.includes(descriptor);
};

const optional = createDecorator("optional", () => ({
  apply: [
    DecoratorType.Property,
    DecoratorType.StaticProperty,
    DecoratorType.Parameter,
  ],
  onInit: (context) => {
    const metadata = optionalMetadata.from(context.target, context.propertyKey);

    const optional = metadata.get({
      index: [],
    });

    if (context.type === DecoratorType.Parameter) {
      optional.index.push(context.descriptor);
    }

    metadata.set(optional);
  },
}));

export type {
  OptionalMetadata,
};

export {
  optionalToken,
  optionalMetadata,
};

export {
  isOptional,
};

export {
  optional,
};
