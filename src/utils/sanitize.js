function sanitizeStringValue(value) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

export function deepSanitize(value) {
  if (typeof value === 'string') {
    return sanitizeStringValue(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => deepSanitize(entry));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, entryValue]) => {
      acc[key] = deepSanitize(entryValue);
      return acc;
    }, {});
  }

  return value;
}
