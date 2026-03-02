export function parseU8Like(input: unknown): number | undefined {
  if (input === null || input === undefined) return undefined;

  // direct primitive
  if (typeof input === "number")
    return Number.isFinite(input) ? input : undefined;
  if (typeof input === "bigint") return Number(input);

  // common scaffold-stark return: [value]
  if (Array.isArray(input)) {
    if (input.length === 0) return undefined;
    // if it's a single return value, unwrap
    if (input.length === 1) return parseU8Like(input[0]);
    // if it's multiple, your ABI isn't a single return — pick first as fallback
    return parseU8Like(input[0]);
  }

  // sometimes starknet-react returns objects like { value: bigint } or { low/high } etc.
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;

    if ("value" in obj) return parseU8Like(obj.value);

    // felt-like keys sometimes show up
    if ("felt" in obj) return parseU8Like(obj.felt);

    // u256 style (just in case): { low, high }
    if ("low" in obj && "high" in obj) {
      const low = parseU8Like(obj.low);
      const high = parseU8Like(obj.high);
      if (low === undefined || high === undefined) return undefined;
      // u256 = low + high * 2^128 (overkill for role, but safe)
      return low; // role should never be u256; fallback
    }
  }

  return undefined;
}
