import { describe, it, expect } from 'vitest';
import { jsonResponse, textResponse, formatError } from '../../../src/tools/utils.js';

describe('utils', () => {
  describe('jsonResponse', () => {
    it('should format object as JSON text content', () => {
      const data = { key: 'value', count: 42 };
      const result = jsonResponse(data);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      });
    });

    it('should pretty-print JSON with 2-space indentation', () => {
      const data = { nested: { key: 'value' } };
      const result = jsonResponse(data);

      expect(result.content[0].text).toBe('{\n  "nested": {\n    "key": "value"\n  }\n}');
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3];
      const result = jsonResponse(data);

      expect(result.content[0].text).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should handle null', () => {
      const result = jsonResponse(null);

      expect(result.content[0].text).toBe('null');
    });

    it('should handle nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      };
      const result = jsonResponse(data);

      expect(result.content[0].text).toBe(JSON.stringify(data, null, 2));
    });

    it('should not set isError', () => {
      const result = jsonResponse({ data: 'test' });

      expect(result.isError).toBeUndefined();
    });
  });

  describe('textResponse', () => {
    it('should format message as text content', () => {
      const message = 'Hello, World!';
      const result = textResponse(message);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      });
    });

    it('should handle empty string', () => {
      const result = textResponse('');

      expect(result.content[0].text).toBe('');
    });

    it('should handle multiline messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const result = textResponse(message);

      expect(result.content[0].text).toBe(message);
    });

    it('should not set isError', () => {
      const result = textResponse('test message');

      expect(result.isError).toBeUndefined();
    });
  });

  describe('formatError', () => {
    it('should format Error instance (extracts message)', () => {
      const error = new Error('Something went wrong');
      const result = formatError(error);

      expect(result.content[0].text).toBe('Error: Something went wrong');
    });

    it('should format string error', () => {
      const result = formatError('String error message');

      expect(result.content[0].text).toBe('Error: String error message');
    });

    it('should format number as error', () => {
      const result = formatError(404);

      expect(result.content[0].text).toBe('Error: 404');
    });

    it('should format object as error', () => {
      const result = formatError({ code: 'ERR_001' });

      expect(result.content[0].text).toBe('Error: [object Object]');
    });

    it('should format null as error', () => {
      const result = formatError(null);

      expect(result.content[0].text).toBe('Error: null');
    });

    it('should format undefined as error', () => {
      const result = formatError(undefined);

      expect(result.content[0].text).toBe('Error: undefined');
    });

    it('should always set isError: true', () => {
      expect(formatError(new Error('test')).isError).toBe(true);
      expect(formatError('string').isError).toBe(true);
      expect(formatError(123).isError).toBe(true);
      expect(formatError(null).isError).toBe(true);
      expect(formatError(undefined).isError).toBe(true);
    });
  });
});
