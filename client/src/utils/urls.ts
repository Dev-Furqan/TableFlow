export const resolveApiBaseUrl = (configured: string | undefined, currentOrigin: string) => {
  const value = String(configured || '').trim();

  if (!value) {
    return '/api';
  }

  if (value.startsWith('/')) {
    return value;
  }

  if (!/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalized = value.replace(/\/+$/, '');
  if (normalized.endsWith('/api')) {
    return normalized;
  }

  if (normalized === currentOrigin) {
    return `${normalized}/api`;
  }

  return `${normalized}/api`;
};

export const resolveSocketUrl = (configured: string | undefined, currentOrigin: string) => {
  const value = String(configured || '').trim();

  if (!value) {
    return currentOrigin;
  }

  const normalized = value.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    return normalized || currentOrigin;
  }

  return normalized.replace(/\/api$/i, '') || currentOrigin;
};
