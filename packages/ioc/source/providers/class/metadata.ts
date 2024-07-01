import Token, {TokenValue} from "~/domain/token";
import Container from "~/domain/container";

enum DesignMetadata {
  TYPE = "design:type",
  PARAMTYPES = "design:paramtypes",
  RETURNTYPE = "design:returntype",
}

const metadata = {
  hasMetadata(key: string, target: any, propertyKey?: any): boolean {
    return Reflect.hasMetadata(key, target, propertyKey);
  },
  getMetadata<T>(key: string, target: any, propertyKey?: any): (T | undefined) {
    return Reflect.getMetadata(key, target, propertyKey);
  },
  setMetadata<T>(key: string, value: T, target: any, propertyKey?: any) {
    return Reflect.defineMetadata(key, value, target, propertyKey);
  },
  deleteMetadata(key: string, target: any, propertyKey?: any) {
    return Reflect.deleteMetadata(key, target, propertyKey);
  },
  //
  hasType(target: any, propertyKey?: any): boolean {
    return metadata.hasMetadata(DesignMetadata.TYPE, target, propertyKey);
  },
  getType(target: any, propertyKey?: any): (any | undefined) {
    return metadata.getMetadata(DesignMetadata.TYPE, target, propertyKey);
  },
  setType(value: any, target: any, propertyKey?: any) {
    return metadata.setMetadata(DesignMetadata.TYPE, value, target, propertyKey);
  },
  deleteType(target: any, propertyKey?: any) {
    return metadata.deleteMetadata(DesignMetadata.TYPE, target, propertyKey);
  },
  //
  hasParamTypes(target: any, propertyKey?: any): boolean {
    return metadata.hasMetadata(DesignMetadata.PARAMTYPES, target, propertyKey);
  },
  getParamTypes(target: any, propertyKey?: any): (any[] | undefined) {
    return metadata.getMetadata(DesignMetadata.PARAMTYPES, target, propertyKey);
  },
  setParamTypes(value: any[], target: any, propertyKey?: any) {
    return metadata.setMetadata(DesignMetadata.PARAMTYPES, value, target, propertyKey);
  },
  deleteParamTypes(target: any, propertyKey?: any) {
    return metadata.deleteMetadata(DesignMetadata.PARAMTYPES, target, propertyKey);
  },
  //
  hasReturnType(target: any, propertyKey?: any): boolean {
    return metadata.hasMetadata(DesignMetadata.RETURNTYPE, target, propertyKey);
  },
  getReturnType(target: any, propertyKey?: any): (any | undefined) {
    return metadata.getMetadata(DesignMetadata.RETURNTYPE, target, propertyKey);
  },
  setReturnType(value: any, target: any, propertyKey?: any) {
    return metadata.setMetadata(DesignMetadata.RETURNTYPE, value, target, propertyKey);
  },
  deleteReturnType(target: any, propertyKey?: any) {
    return metadata.deleteMetadata(DesignMetadata.RETURNTYPE, target, propertyKey);
  },
};

interface FromMetadata<T> {
  has(): boolean;

  get(defaultValue?: T): T | undefined;

  set(value: T): void;
}

interface ListMetadata<T> extends Array<T> {
}

interface Metadata<T> {
  get(target: any, propertyKey?: any): T | undefined;

  set(value: T, target: any, propertyKey?: any): void;

  has(target: any, propertyKey?: any): boolean;

  from(target: any, propertyKey?: any): FromMetadata<T>;

  list(target: any): ListMetadata<T>;
}

const createMetadata = <T>(token: TokenValue<unknown>): Metadata<T> => {
  token = Token.from(token);

  return {
    get(target: any, propertyKey?: any) {
      return metadata.getMetadata<T>(token.id, target, propertyKey);
    },
    set(value: T, target: any, propertyKey?: string) {
      return metadata.setMetadata<T>(token.id, value, target, propertyKey);
    },
    has(target: any, propertyKey?: string) {
      return metadata.hasMetadata(token.id, target, propertyKey);
    },
    from(target: any, propertyKey?: string): FromMetadata<T> {
      return {
        get(defaultValue?: T) {
          return metadata.getMetadata<T>(token.id, target, propertyKey) ?? defaultValue;
        },
        set(value: T) {
          return metadata.setMetadata<T>(token.id, value, target, propertyKey);
        },
        has() {
          return metadata.hasMetadata(token.id, target, propertyKey);
        },
      };
    },
    list(target: any): ListMetadata<T> {
      const list = metadata.getMetadata<ListMetadata<T>>(token.id, target) ?? [];
      return new Proxy(list, {
        set: (target, propertyKey, value) => {
          Reflect.set(target, propertyKey, value);
          metadata.setMetadata<ListMetadata<T>>(token.id, target, target);
          return true;
        },
        deleteProperty(target, p) {
          Reflect.deleteProperty(target, p);
          metadata.setMetadata<ListMetadata<T>>(token.id, target, target);
          return true;
        },
      });
    },
  };
};

//

const dependenciesMetadata = createMetadata<Token<unknown>[]>(
  Token.create("buny", "dependencies"),
);

//

interface PropertyContext {
  container: Container;
}

interface PropertyMetadata {
  key: PropertyKey;
  handler: (context: PropertyContext) => Promise<unknown> | unknown;
}

const propertiesMetadata = createMetadata<PropertyMetadata[]>(
  Token.create("buny", "property"),
);

//

interface ParameterContext {
  container: Container;
}

interface ParameterMetadata {
  index: number;
  handler: (context: ParameterContext) => Promise<unknown> | unknown;
}

const parametersMetadata = createMetadata<ParameterMetadata[]>(
  Token.create("buny", "parameter"),
);

//

interface RegisterContext {
  container: Container;
}

interface RegisterMetadata {
  displayClass: string;
  displayName: string;
  handler: (context: RegisterContext) => Promise<void> | void;
}

const registerMetadata = createMetadata<RegisterMetadata[]>(
  Token.create("buny", "register"),
);

//

interface ResolveContext {
  container: Container;
  instance: Object;
}

interface ResolveMetadata {
  displayClass: string;
  displayName: string;
  handler: (context: ResolveContext) => Promise<void> | void;
}

const resolveMetadata = createMetadata<ResolveMetadata[]>(
  Token.create("buny", "resolve"),
);

//

interface DisposeContext {
  container: Container;
  instance: Object;
}

interface DisposeMetadata {
  displayClass: string;
  displayName: string;
  handler: (context: DisposeContext) => Promise<void> | void;
}

const disposeMetadata = createMetadata<DisposeMetadata[]>(
  Token.create("buny", "dispose"),
);

//

interface DestroyContext {
  container: Container;
}

interface DestroyMetadata {
  displayClass: string;
  displayName: string;
  handler: (context: DestroyContext) => Promise<void> | void;
}

const destroyMetadata = createMetadata<DestroyMetadata[]>(
  Token.create("buny", "destroy"),
);

//

export type {
  Metadata,
};

export {
  metadata,
};

export {
  createMetadata,
};

export type {
  DestroyContext,
  DestroyMetadata,
  //
  PropertyContext,
  PropertyMetadata,
  //
  ParameterContext,
  ParameterMetadata,
  //
  RegisterContext,
  RegisterMetadata,
  //
  ResolveContext,
  ResolveMetadata,
  //
  DisposeContext,
  DesignMetadata,
};

export {
  dependenciesMetadata,
  //
  propertiesMetadata,
  parametersMetadata,
  //
  registerMetadata,
  resolveMetadata,
  disposeMetadata,
  destroyMetadata,
};
