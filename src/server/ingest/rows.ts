import { Schema } from "effect";

export function stringRow(
  value: unknown,
  fields: readonly string[],
): Record<string, string | undefined> | null {
  const shape = Schema.Struct(
    Object.fromEntries(fields.map((key) => [key, Schema.optionalKey(Schema.String)])),
  );
  const result = Schema.decodeUnknownResult(shape)(value);
  return result._tag === "Success" ? result.success : null;
}
