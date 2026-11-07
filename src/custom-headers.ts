/** Headers the client owns (or that framing depends on); custom headers must never set them. */
const PROTECTED_HEADERS: ReadonlySet<string> = new Set([
  'authorization',
  'accept',
  'content-type',
  'content-length',
  'transfer-encoding',
  'connection',
  'host',
]);

/** RFC 7230 token characters. */
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/** Control characters (incl. CR/LF/NUL) and anything outside Latin-1 are not allowed in values. */
// eslint-disable-next-line no-control-regex
const INVALID_HEADER_VALUE_PATTERN = /[\u0000-\u0008\u000a-\u001f\u007f]|[^\u0000-ÿ]/;

const CF_ID_HEADER = 'CF-Access-Client-Id';
const CF_SECRET_HEADER = 'CF-Access-Client-Secret';

type Env = Readonly<Record<string, string | undefined>>;

function nonEmpty(value: string | undefined): string | undefined {
  return value === undefined || value === '' ? undefined : value;
}

/**
 * Parse BAMBOO_HEADERS. Error messages deliberately omit header values
 * because they may contain secrets.
 */
function parseHeadersJson(raw: string): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('BAMBOO_HEADERS must be valid JSON');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('BAMBOO_HEADERS must be a JSON object of header names to string values');
  }

  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(`BAMBOO_HEADERS value for "${name}" must be a string`);
    }
    headers[name] = value;
  }
  return headers;
}

/**
 * Validate header names and values. Throws without echoing any value.
 * Used both when parsing env vars and when constructing a client directly.
 */
export function validateCustomHeaders(headers: Readonly<Record<string, string>>): void {
  for (const [name, value] of Object.entries(headers)) {
    if (!HEADER_NAME_PATTERN.test(name)) {
      throw new Error(`Invalid header name in custom headers: "${name}"`);
    }
    if (PROTECTED_HEADERS.has(name.toLowerCase())) {
      throw new Error(`Custom headers cannot set protected header "${name}"`);
    }
    if (INVALID_HEADER_VALUE_PATTERN.test(value)) {
      throw new Error(`Custom header "${name}" has a value with invalid characters`);
    }
  }
}

/** Drop any header whose name matches (case-insensitively) one of `names`. */
function withoutNames(
  headers: Readonly<Record<string, string>>,
  names: readonly string[]
): Record<string, string> {
  const lowered = new Set(names.map((n) => n.toLowerCase()));
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => !lowered.has(name.toLowerCase()))
  );
}

/**
 * Build extra request headers from environment variables.
 *
 * - BAMBOO_HEADERS: JSON object of arbitrary extra headers
 * - BAMBOO_CF_ACCESS_CLIENT_ID / BAMBOO_CF_ACCESS_CLIENT_SECRET: Cloudflare
 *   Access service token (must be set together; wins over BAMBOO_HEADERS)
 */
export function parseCustomHeaders(env: Env): Readonly<Record<string, string>> {
  const rawHeaders = nonEmpty(env.BAMBOO_HEADERS);
  const cfId = nonEmpty(env.BAMBOO_CF_ACCESS_CLIENT_ID);
  const cfSecret = nonEmpty(env.BAMBOO_CF_ACCESS_CLIENT_SECRET);

  if ((cfId === undefined) !== (cfSecret === undefined)) {
    throw new Error(
      'BAMBOO_CF_ACCESS_CLIENT_ID and BAMBOO_CF_ACCESS_CLIENT_SECRET must be set together'
    );
  }

  const fromJson = rawHeaders === undefined ? {} : parseHeadersJson(rawHeaders);
  const merged =
    cfId === undefined || cfSecret === undefined
      ? fromJson
      : {
          ...withoutNames(fromJson, [CF_ID_HEADER, CF_SECRET_HEADER]),
          [CF_ID_HEADER]: cfId,
          [CF_SECRET_HEADER]: cfSecret,
        };

  validateCustomHeaders(merged);
  return merged;
}
