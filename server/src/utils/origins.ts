export const parseAllowedOrigins = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isWildcardOrigin = (allowedOrigin: string, origin: string) => {
  if (!allowedOrigin.startsWith('*.')) {
    return false;
  }

  const suffix = allowedOrigin.slice(1);
  return origin.endsWith(suffix);
};

export const isOriginAllowed = (origin: string | undefined, configuredOrigins: string[], nodeEnv: string) => {
  if (!origin) {
    return true;
  }

  if (nodeEnv !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  return configuredOrigins.some((allowedOrigin) => {
    const normalizedAllowedOrigin = allowedOrigin.replace(/\/+$/, '');
    return normalizedAllowedOrigin === origin || isWildcardOrigin(normalizedAllowedOrigin, origin);
  });
};
