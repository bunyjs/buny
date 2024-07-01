type Constructor<T> = new (...args: any[]) => T;

type AbstractConstructor<T> = abstract new (...args: any[]) => T;

export type {
  Constructor,
  AbstractConstructor,
};
