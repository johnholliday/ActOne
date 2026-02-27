/**
 * Password validation logic extracted from settings/account page.
 */

export type PasswordValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validatePasswordChange(
  newPassword: string,
  confirmPassword: string,
): PasswordValidationResult {
  if (!newPassword) {
    return { valid: false, error: 'Please enter a new password' };
  }
  if (newPassword !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  if (newPassword.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}
