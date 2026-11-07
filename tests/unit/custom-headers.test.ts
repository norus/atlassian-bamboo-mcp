import { describe, it, expect } from 'vitest';
import { parseCustomHeaders } from '../../src/custom-headers.js';

describe('parseCustomHeaders()', () => {
  it('should return an empty object when nothing is configured', () => {
    expect(parseCustomHeaders({})).toEqual({});
  });

  it('should parse BAMBOO_HEADERS JSON', () => {
    const headers = parseCustomHeaders({
      BAMBOO_HEADERS: '{"X-Foo":"bar","X-Baz":"qux"}',
    });
    expect(headers).toEqual({ 'X-Foo': 'bar', 'X-Baz': 'qux' });
  });

  it('should map the Cloudflare Access shortcuts to headers', () => {
    const headers = parseCustomHeaders({
      BAMBOO_CF_ACCESS_CLIENT_ID: 'id.access',
      BAMBOO_CF_ACCESS_CLIENT_SECRET: 's3cret',
    });
    expect(headers).toEqual({
      'CF-Access-Client-Id': 'id.access',
      'CF-Access-Client-Secret': 's3cret',
    });
  });

  it('should merge BAMBOO_HEADERS with the Cloudflare pair', () => {
    const headers = parseCustomHeaders({
      BAMBOO_HEADERS: '{"X-Foo":"bar"}',
      BAMBOO_CF_ACCESS_CLIENT_ID: 'id',
      BAMBOO_CF_ACCESS_CLIENT_SECRET: 'secret',
    });
    expect(headers).toEqual({
      'X-Foo': 'bar',
      'CF-Access-Client-Id': 'id',
      'CF-Access-Client-Secret': 'secret',
    });
  });

  it('should let the Cloudflare shortcuts win over BAMBOO_HEADERS', () => {
    const headers = parseCustomHeaders({
      BAMBOO_HEADERS: '{"cf-access-client-id":"old"}',
      BAMBOO_CF_ACCESS_CLIENT_ID: 'new',
      BAMBOO_CF_ACCESS_CLIENT_SECRET: 'secret',
    });
    expect(headers['CF-Access-Client-Id']).toBe('new');
    expect(headers['cf-access-client-id']).toBeUndefined();
  });

  it('should throw on invalid JSON without leaking the value', () => {
    expect(() => parseCustomHeaders({ BAMBOO_HEADERS: '{oops-s3cret' })).toThrow(
      /BAMBOO_HEADERS must be valid JSON/
    );
    expect(() => parseCustomHeaders({ BAMBOO_HEADERS: '{oops-s3cret' })).not.toThrow(
      /s3cret/
    );
  });

  it.each(['[]', '"str"', '42', 'null'])('should reject non-object JSON (%s)', (raw) => {
    expect(() => parseCustomHeaders({ BAMBOO_HEADERS: raw })).toThrow(
      /BAMBOO_HEADERS must be a JSON object/
    );
  });

  it('should reject non-string header values without leaking them', () => {
    const run = () => parseCustomHeaders({ BAMBOO_HEADERS: '{"X-Foo":12345}' });
    expect(run).toThrow(/"X-Foo" must be a string/);
    expect(run).not.toThrow(/12345/);
  });

  it('should reject invalid header names', () => {
    expect(() =>
      parseCustomHeaders({ BAMBOO_HEADERS: '{"Bad Name":"v"}' })
    ).toThrow(/Invalid header name/);
  });

  it.each(['Authorization', 'authorization', 'ACCEPT', 'Content-Type', 'host'])(
    'should reject protected header %s',
    (name) => {
      expect(() =>
        parseCustomHeaders({ BAMBOO_HEADERS: JSON.stringify({ [name]: 'v' }) })
      ).toThrow(/protected header/);
    }
  );

  it.each(['Content-Length', 'transfer-encoding', 'Connection'])(
    'should reject framing header %s',
    (name) => {
      expect(() =>
        parseCustomHeaders({ BAMBOO_HEADERS: JSON.stringify({ [name]: 'v' }) })
      ).toThrow(/protected header/);
    }
  );

  it('should reject header values containing control characters without leaking them', () => {
    const run = () =>
      parseCustomHeaders({ BAMBOO_HEADERS: JSON.stringify({ 'X-Foo': 'abc\r\nX-Evil: s3cret' }) });
    expect(run).toThrow(/invalid characters/);
    expect(run).not.toThrow(/s3cret/);
  });

  it('should reject Cloudflare values containing control characters', () => {
    expect(() =>
      parseCustomHeaders({
        BAMBOO_CF_ACCESS_CLIENT_ID: 'id\n',
        BAMBOO_CF_ACCESS_CLIENT_SECRET: 'secret',
      })
    ).toThrow(/invalid characters/);
  });

  it('should require the Cloudflare id and secret together', () => {
    expect(() =>
      parseCustomHeaders({ BAMBOO_CF_ACCESS_CLIENT_ID: 'id' })
    ).toThrow(/BAMBOO_CF_ACCESS_CLIENT_ID and BAMBOO_CF_ACCESS_CLIENT_SECRET must be set together/);
    expect(() =>
      parseCustomHeaders({ BAMBOO_CF_ACCESS_CLIENT_SECRET: 'secret' })
    ).toThrow(/must be set together/);
  });

  it('should treat empty-string env values as unset', () => {
    expect(
      parseCustomHeaders({
        BAMBOO_HEADERS: '',
        BAMBOO_CF_ACCESS_CLIENT_ID: '',
        BAMBOO_CF_ACCESS_CLIENT_SECRET: '',
      })
    ).toEqual({});
  });
});
