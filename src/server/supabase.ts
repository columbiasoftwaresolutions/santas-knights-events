import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Context, Effect, Layer, Schema } from "effect";

// One service, two layers. `reader` uses the public (publishable) key and is
// subject to RLS: it is what the directory reads with. `admin` uses the service
// role key, bypasses RLS and only ingestion may use it. Never import this file
// from a client component, and never log the clients or the keys.

export class ConfigError extends Schema.TaggedError<ConfigError>()("ConfigError", {
  message: Schema.String,
}) {}

export class DbError extends Schema.TaggedError<DbError>()("DbError", {
  operation: Schema.String,
  message: Schema.String,
}) {}

export class Supabase extends Context.Service<Supabase, { readonly client: SupabaseClient }>()(
  "sk/server/Supabase",
) {
  static readonly reader = Layer.effect(
    Supabase,
    Effect.gen(function* () {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) {
        return yield* new ConfigError({ message: "Supabase URL or publishable key is not set." });
      }
      return Supabase.of({ client: makeClient(url, key) });
    }),
  );

  static readonly admin = Layer.effect(
    Supabase,
    Effect.gen(function* () {
      const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        return yield* new ConfigError({ message: "Supabase URL or service role key is not set." });
      }
      return Supabase.of({ client: makeClient(url, key) });
    }),
  );
}

function makeClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function hasReaderConfig(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY),
  );
}

// supabase-js reports failures in the result, not by throwing. Turn them into DbError.
export const dbCall = <A>(
  operation: string,
  run: () => PromiseLike<{ data: A | null; error: { message: string } | null }>,
): Effect.Effect<A | null, DbError> =>
  Effect.tryPromise({
    try: async () => {
      const { data, error } = await run();
      if (error) throw new Error(error.message);
      return data;
    },
    catch: (cause) =>
      new DbError({ operation, message: cause instanceof Error ? cause.message : String(cause) }),
  });
