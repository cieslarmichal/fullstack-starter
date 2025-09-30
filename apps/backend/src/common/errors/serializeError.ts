export function serializeError(
  error: unknown,
  includeStack = false,
  seen = new WeakSet<object>(),
): Record<string, unknown> {
  if (error instanceof Error) {
    if (seen.has(error)) {
      return { message: 'Circular reference' };
    }
    seen.add(error);

    return {
      name: error.name,
      message: error.message,
      ...Object.fromEntries(
        Object.getOwnPropertyNames(error)
          .filter((key) => includeStack || key !== 'stack')
          .map((key) => [key, serializeValue(Reflect.get(error, key), includeStack, seen)]),
      ),
    };
  }

  return { error: serializeValue(error, includeStack, seen) };
}

function serializeValue(value: unknown, includeStack = false, seen: WeakSet<object>): unknown {
  if (value instanceof Error) {
    return serializeError(value, includeStack, seen);
  } else if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) {
      return 'Circular reference';
    }
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeValue(val, includeStack, seen)]),
    );
  }

  return value;
}
