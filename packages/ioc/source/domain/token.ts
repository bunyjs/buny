import Provider from "./provider";

import {Constructor, AbstractConstructor} from "~/types/class";

type TokenId = string;

type TokenValue<Value> = string | Constructor<Value> | AbstractConstructor<Value> | Token<Value> | Provider<Value>;

class Token<Value> {
  id: TokenId;

  constructor(id: TokenId) {
    this.id = id;
  }

  variant(id: TokenValue<Value>): Token<Value> {
    const token = Token.from<any>(id);
    return Token.concat(this, token);
  }

  match(id: TokenValue<Value>) {
    return Token.from(id).id === this.id;
  }

  toString() {
    return this.id.toString();
  }

  static create<Value>(...ids: string[]) {
    return new Token<Value>(ids.join(":"));
  }

  static from<Value>(id: TokenValue<Value>): Token<Value> {
    if (id instanceof Token) {
      return id;
    }

    if (id instanceof Provider) {
      return id.token;
    }

    if (typeof id === "string") {
      return new Token<Value>(id);
    }

    if (typeof id === "function") {
      return new Token<Value>(id.name);
    }

    throw new Error("Invalid token id");
  }

  static tryFrom<Value>(id: TokenValue<Value>) {
    try {
      return Token.from(id);
    } catch {
      return null;
    }
  }

  static concat<Value>(...tokens: Token<Value>[]) {
    return new Token<Value>(tokens.map((token) => token.id).join(":"));
  }
}

export type {
  TokenId,
  TokenValue,
};

export default Token;
