// Mirrors the API's password policy (servihub-api/src/validators/common.js)
// so people see the problem before submitting. The API remains the judge.
export function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password must be at most 128 characters";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number";
  }
  return "";
}
