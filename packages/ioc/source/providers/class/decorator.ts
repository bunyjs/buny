import container, {AbstractConstructor} from "~/main";

import Container from "~/domain/container";
import Token, {TokenValue} from "~/domain/token";

import {Constructor} from "~/types/class";

import {PropertyContext, ParameterContext, dependenciesMetadata, propertiesMetadata, parametersMetadata, disposeMetadata, resolveMetadata, registerMetadata, destroyMetadata} from "./metadata";

enum DecoratorType {
  Class = "Class",
  Property = "Property",
  StaticProperty = "StaticProperty",
  Accessor = "Accessor",
  StaticAccessor = "StaticAccessor",
  Method = "Method",
  StaticMethod = "StaticMethod",
  Parameter = "Parameter",
}

const getDecoratorType = (target: any, key?: any, descriptor?: any) => {
  if (target && key === undefined && descriptor === undefined) {
    return DecoratorType.Class;
  }

  if (descriptor === undefined) {
    if (typeof target === "function") {
      return DecoratorType.StaticProperty;
    }

    return DecoratorType.Property;
  }

  if (typeof descriptor === "number") {
    return DecoratorType.Parameter;
  }

  if (descriptor.value) {
    if (typeof target === "function") {
      return DecoratorType.StaticMethod;
    }

    return DecoratorType.Method;
  }

  if (descriptor.get || descriptor.set) {
    if (typeof target === "function") {
      return DecoratorType.StaticAccessor;
    }

    return DecoratorType.Accessor;
  }

  throw new Error("Decorator type not found");
};

class DecoratorContext {
  name: string;
  target: any;
  propertyKey?: any;
  descriptor?: any;

  container: Container;

  get type() {
    return getDecoratorType(this.target, this.propertyKey, this.descriptor);
  }

  get class() {
    if (this.isInstance) {
      return this.target.constructor;
    }

    return this.target;
  }

  get isInstance() {
    return (
      this.type === DecoratorType.Property ||
      this.type === DecoratorType.Accessor ||
      this.type === DecoratorType.Method
    );
  }

  get isStatic() {
    return (
      this.type === DecoratorType.StaticProperty ||
      this.type === DecoratorType.StaticAccessor ||
      this.type === DecoratorType.StaticMethod
    );
  }

  get displayName() {
    return `@${this.name}`;
  }

  get displayClass() {
    return String(this.class.name);
  }

  get displayPath() {
    let className = this.displayClass;

    if (this.propertyKey === undefined) {
      return className;
    }

    return `${className}#${this.propertyKey}`;
  }

  addDependency(...tokens: TokenValue<unknown>[]) {
    const metadata = dependenciesMetadata.from(this.class);

    const dependencies = metadata.get([]);

    dependencies.push(...tokens.map((token) => Token.from(token)));

    metadata.set(dependencies);
  }

  getDependency() {
    const metadata = dependenciesMetadata.from(this.class);
    return metadata.get([]);
  }

  //

  defineProperty(handler: (context: PropertyContext) => unknown) {
    const metadata = propertiesMetadata.from(this.target);

    const properties = metadata.get([]);

    properties.push({
      key: this.propertyKey,
      handler,
    });

    metadata.set(properties);
  }

  defineParameter(handler: (context: ParameterContext) => unknown) {
    const metadata = parametersMetadata.from(this.target, this.propertyKey);

    const parameters = metadata.get([]);

    parameters.push({
      index: this.descriptor,
      handler,
    });

    metadata.set(parameters);
  }

  //

  onInit(handler: (context: InitDecoratorContext) => void) {
    const initDecoratorContext = InitDecoratorContext.from(this);

    initDecoratorContext.container = container;

    handler(initDecoratorContext);
  }

  onBoostrap(handler: (context: BootstrapDecoratorContext) => Promise<void> | void) {
    container.on("boostrap", async (context) => {
      const bootstrapDecoratorContext = BootstrapDecoratorContext.from(this);

      bootstrapDecoratorContext.container = context.container;

      return handler(bootstrapDecoratorContext);
    });
  }

  onRegister(handler: (context: RegisterDecoratorContext) => Promise<void> | void) {
    const metadata = registerMetadata.from(this.target);

    const registers = metadata.get([]);

    registers.push({
      displayClass: this.displayClass,
      displayName: this.displayName,
      handler: ({container}) => {
        const registerDecoratorContext = RegisterDecoratorContext.from(this);

        registerDecoratorContext.container = container;

        return handler(registerDecoratorContext);
      },
    });

    metadata.set(registers);
  }

  onResolve(handler: (context: ResolveDecoratorContext) => Promise<void> | void) {
    const metadata = resolveMetadata.from(this.target);

    const resolves = metadata.get([]);

    resolves.push({
      displayClass: this.displayClass,
      displayName: this.displayName,
      handler: ({container, instance}) => {
        const resolveDecoratorContext = ResolveDecoratorContext.from(this);

        resolveDecoratorContext.container = container;
        resolveDecoratorContext.instance = instance;

        return handler(resolveDecoratorContext);
      },
    });

    metadata.set(resolves);
  }

  onDispose(handler: (context: DisposeDecoratorContext) => Promise<void> | void) {
    const metadata = disposeMetadata.from(this.target);

    const disposes = metadata.get([]);

    disposes.push({
      displayClass: this.displayClass,
      displayName: this.displayName,
      handler: ({container, instance}) => {
        const disposeDecoratorContext = DisposeDecoratorContext.from(this);

        disposeDecoratorContext.container = container;
        disposeDecoratorContext.instance = instance;

        return handler(disposeDecoratorContext);
      },
    });

    metadata.set(disposes);
  }

  onDestroy(handler: (context: DestroyDecoratorContext) => Promise<void> | void) {
    const metadata = destroyMetadata.from(this.target);

    const destroys = metadata.get([]);

    destroys.push({
      displayClass: this.displayClass,
      displayName: this.displayName,
      handler: ({container}) => {
        const destroyDecoratorContext = DestroyDecoratorContext.from(this);

        destroyDecoratorContext.container = container;

        return handler(destroyDecoratorContext);
      },
    });

    metadata.set(destroys);
  }
}

class InitDecoratorContext extends DecoratorContext {
  static from(context: DecoratorContext) {
    const initDecoratorContext = new InitDecoratorContext();
    Object.assign(initDecoratorContext, context);
    return initDecoratorContext;
  }
}

class BootstrapDecoratorContext extends DecoratorContext {
  static from(context: DecoratorContext) {
    const bootstrapDecoratorContext = new BootstrapDecoratorContext();
    Object.assign(bootstrapDecoratorContext, context);
    return bootstrapDecoratorContext;
  }
}

class RegisterDecoratorContext extends DecoratorContext {
  static from(context: DecoratorContext) {
    const registerDecoratorContext = new RegisterDecoratorContext();
    Object.assign(registerDecoratorContext, context);
    return registerDecoratorContext;
  }
}

class ResolveDecoratorContext extends DecoratorContext {
  instance: any;

  static from(context: DecoratorContext) {
    const resolveDecoratorContext = new ResolveDecoratorContext();
    Object.assign(resolveDecoratorContext, context);
    return resolveDecoratorContext;
  }
}

class DisposeDecoratorContext extends DecoratorContext {
  instance: any;

  static from(context: DecoratorContext) {
    const disposeDecoratorContext = new DisposeDecoratorContext();
    Object.assign(disposeDecoratorContext, context);
    return disposeDecoratorContext;
  }
}

class DestroyDecoratorContext extends DecoratorContext {
  static from(context: DecoratorContext) {
    const destroyDecoratorContext = new DestroyDecoratorContext();
    Object.assign(destroyDecoratorContext, context);
    return destroyDecoratorContext;
  }
}

type DecoratorHandler = (target: any, propertyKey?: any, descriptor?: any) => void;

type DecoratorCallback = (...args: any[]) => {
  apply?: DecoratorType[];
  instance?: (Constructor<unknown> | AbstractConstructor<unknown>)[];
  use?: DecoratorHandler[];
  onInit?: (context: InitDecoratorContext) => void;
  onBoostrap?: (context: BootstrapDecoratorContext) => Promise<void> | void;
  onRegister?: (context: RegisterDecoratorContext) => Promise<void> | void;
  onResolve?: (context: ResolveDecoratorContext) => Promise<void> | void;
  onDispose?: (context: DisposeDecoratorContext) => Promise<void> | void;
  onDestroy?: (context: DestroyDecoratorContext) => Promise<void> | void;
};

const createDecorator = <Callback extends DecoratorCallback>(name: string, callback: Callback) => {
  return (...args: Parameters<Callback>) => {
    return (target: any, propertyKey?: any, descriptor?: any) => {
      const handler = callback(...args);

      const decoratorContext = new DecoratorContext();

      decoratorContext.name = name;
      decoratorContext.target = target;
      decoratorContext.propertyKey = propertyKey;
      decoratorContext.descriptor = descriptor;

      if (handler.apply) {
        if (!handler.apply.includes(decoratorContext.type)) {
          throw new Error(`${decoratorContext.displayName} ${decoratorContext.displayPath} can only be used on ${handler.apply.join(", ")}`);
        }
      }

      if (handler.instance?.length) {
        const matchInstance = handler.instance.some((instance) => {
          return decoratorContext.class.prototype instanceof instance;
        });

        if (!matchInstance) {
          throw new Error(`Cannot use ${decoratorContext.displayClass} ${decoratorContext.displayName} does not extend ${handler.instance.map((instance) => instance.name).join(", ")}`);
        }
      }

      if (handler.use?.length) {
        for (const use of handler.use) {
          use(target, propertyKey, descriptor);
        }
      }

      if (handler.onInit) {
        decoratorContext.onInit(handler.onInit);
      }

      if (handler.onBoostrap) {
        decoratorContext.onBoostrap(handler.onBoostrap);
      }

      if (handler.onRegister) {
        decoratorContext.onRegister(handler.onRegister);
      }

      if (handler.onResolve) {
        decoratorContext.onResolve(handler.onResolve);
      }

      if (handler.onDispose) {
        decoratorContext.onDispose(handler.onDispose);
      }

      if (handler.onDestroy) {
        decoratorContext.onDestroy(handler.onDestroy);
      }
    };
  };
};

//

export {
  DecoratorType,
};

export {
  getDecoratorType,
};

export {
  createDecorator,
};
