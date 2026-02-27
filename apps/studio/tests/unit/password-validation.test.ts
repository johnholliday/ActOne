import { describe, it, expect } from 'vitest';
import { validatePasswordChange } from '$lib/validation/password.js';

describe('validatePasswordChange', () => {
  it('rejects empty password', () => {
    const result = validatePasswordChange('', 'anything');
    expect(result).toEqual({ valid: false, error: 'Please enter a new password' });
  });

  it('rejects mismatched passwords', () => {
    const result = validatePasswordChange('password1', 'password2');
    expect(result).toEqual({ valid: false, error: 'Passwords do not match' });
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validatePasswordChange('short', 'short');
    expect(result).toEqual({ valid: false, error: 'Password must be at least 8 characters' });
  });

  it('rejects exactly 7 characters', () => {
    const result = validatePasswordChange('1234567', '1234567');
    expect(result).toEqual({ valid: false, error: 'Password must be at least 8 characters' });
  });

  it('accepts 8+ character matching passwords', () => {
    const result = validatePasswordChange('12345678', '12345678');
    expect(result).toEqual({ valid: true });
  });

  it('accepts long matching passwords', () => {
    const pw = 'a-very-long-and-secure-password-2026!';
    const result = validatePasswordChange(pw, pw);
    expect(result).toEqual({ valid: true });
  });

  it('checks emptiness before match (priority order)', () => {
    // Empty password should trigger "enter a password" not "do not match"
    const result = validatePasswordChange('', 'something');
    expect(result).toEqual({ valid: false, error: 'Please enter a new password' });
  });
});
