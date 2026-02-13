import { describe, it, expect } from 'vitest';
import {
  Ok,
  Err,
  isOk,
  isErr,
  map,
  flatMap,
  unwrap,
  unwrapOr,
  type Result,
} from '../result.js';

describe('Result', () => {
  describe('Ok', () => {
    it('should create a successful result', () => {
      const result = Ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it('should work with different types', () => {
      const strResult = Ok('hello');
      const objResult = Ok({ name: 'test' });
      expect(strResult).toEqual({ ok: true, value: 'hello' });
      expect(objResult).toEqual({ ok: true, value: { name: 'test' } });
    });
  });

  describe('Err', () => {
    it('should create a failed result', () => {
      const result = Err('error message');
      expect(result).toEqual({ ok: false, error: 'error message' });
    });

    it('should work with Error objects', () => {
      const error = new Error('something went wrong');
      const result = Err(error);
      expect(result).toEqual({ ok: false, error });
    });
  });

  describe('isOk', () => {
    it('should return true for Ok results', () => {
      const result = Ok(42);
      expect(isOk(result)).toBe(true);
    });

    it('should return false for Err results', () => {
      const result = Err('error');
      expect(isOk(result)).toBe(false);
    });

    it('should narrow types correctly', () => {
      const result: Result<number, string> = Ok(42);
      if (isOk(result)) {
        // TypeScript should know result.value is number
        expect(result.value).toBe(42);
      }
    });
  });

  describe('isErr', () => {
    it('should return true for Err results', () => {
      const result = Err('error');
      expect(isErr(result)).toBe(true);
    });

    it('should return false for Ok results', () => {
      const result = Ok(42);
      expect(isErr(result)).toBe(false);
    });

    it('should narrow types correctly', () => {
      const result: Result<number, string> = Err('failed');
      if (isErr(result)) {
        // TypeScript should know result.error is string
        expect(result.error).toBe('failed');
      }
    });
  });

  describe('map', () => {
    it('should transform Ok values', () => {
      const result = Ok(5);
      const mapped = map(result, (x) => x * 2);
      expect(mapped).toEqual({ ok: true, value: 10 });
    });

    it('should not transform Err values', () => {
      const result = Err<number, string>('error');
      const mapped = map(result, (x) => x * 2);
      expect(mapped).toEqual({ ok: false, error: 'error' });
    });

    it('should change value type', () => {
      const result = Ok(42);
      const mapped = map(result, (x) => `number: ${x}`);
      expect(mapped).toEqual({ ok: true, value: 'number: 42' });
    });
  });

  describe('flatMap', () => {
    it('should chain Ok results', () => {
      const result = Ok(5);
      const chained = flatMap(result, (x) => Ok(x * 2));
      expect(chained).toEqual({ ok: true, value: 10 });
    });

    it('should propagate Err from first result', () => {
      const result = Err<number, string>('first error');
      const chained = flatMap(result, (x) => Ok(x * 2));
      expect(chained).toEqual({ ok: false, error: 'first error' });
    });

    it('should propagate Err from function', () => {
      const result = Ok(5);
      const chained = flatMap(result, (_x) => Err('second error'));
      expect(chained).toEqual({ ok: false, error: 'second error' });
    });

    it('should allow chaining multiple operations', () => {
      const result = Ok(5);
      const final = flatMap(
        flatMap(result, (x) => Ok(x * 2)),
        (x) => Ok(x + 3)
      );
      expect(final).toEqual({ ok: true, value: 13 });
    });
  });

  describe('unwrap', () => {
    it('should return value from Ok', () => {
      const result = Ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it('should throw error from Err', () => {
      const result = Err('something failed');
      expect(() => unwrap(result)).toThrow('something failed');
    });

    it('should throw Error object from Err', () => {
      const error = new Error('custom error');
      const result = Err(error);
      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('unwrapOr', () => {
    it('should return value from Ok', () => {
      const result = Ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default value from Err', () => {
      const result = Err<number, string>('error');
      expect(unwrapOr(result, 0)).toBe(0);
    });

    it('should work with complex default values', () => {
      const result = Err<{ name: string }, string>('error');
      const defaultValue = { name: 'default' };
      expect(unwrapOr(result, defaultValue)).toBe(defaultValue);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle division with error checking', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) {
          return Err('Division by zero');
        }
        return Ok(a / b);
      };

      expect(divide(10, 2)).toEqual({ ok: true, value: 5 });
      expect(divide(10, 0)).toEqual({ ok: false, error: 'Division by zero' });
    });

    it('should handle parsing with transformations', () => {
      const parseAndDouble = (str: string): Result<number, string> => {
        const num = parseInt(str, 10);
        if (isNaN(num)) {
          return Err('Invalid number');
        }
        return map(Ok(num), (n) => n * 2);
      };

      expect(parseAndDouble('5')).toEqual({ ok: true, value: 10 });
      expect(parseAndDouble('abc')).toEqual({ ok: false, error: 'Invalid number' });
    });

    it('should chain multiple fallible operations', () => {
      const parse = (str: string): Result<number, string> => {
        const num = parseInt(str, 10);
        return isNaN(num) ? Err('Invalid number') : Ok(num);
      };

      const validate = (num: number): Result<number, string> => {
        return num > 0 ? Ok(num) : Err('Must be positive');
      };

      const processString = (str: string): Result<number, string> => {
        return flatMap(parse(str), validate);
      };

      expect(processString('5')).toEqual({ ok: true, value: 5 });
      expect(processString('abc')).toEqual({ ok: false, error: 'Invalid number' });
      expect(processString('-5')).toEqual({ ok: false, error: 'Must be positive' });
    });
  });
});
