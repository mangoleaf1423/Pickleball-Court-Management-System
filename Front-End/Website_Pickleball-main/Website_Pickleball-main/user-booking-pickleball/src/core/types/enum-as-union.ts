type StringValues<T> = {
  [K in keyof T]: T[K] extends string ? T[K] : never;
}[keyof T];

type NumberValues<T> = {
  [K in keyof T]: T[K] extends number ? T[K] : never;
}[keyof T];

/**
 * Usage : type EnumValues = EnumAsUnion<typeof anEnum>
 */
export type EnumAsUnion<T> = `${StringValues<T>}` | NumberValues<T>;
