export function errorType(value: unknown): Error {
  if (value instanceof Error) return value;

  let stringified = "";
  try {
    stringified = JSON.stringify(value);
  } catch {
    stringified = "Can't stringify the value";
  }

  return new Error(stringified);
}
