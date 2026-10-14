import { env, isProduction } from "../config/env.js";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

// The refresh cookie is only sent to the auth routes (/refresh and /logout
// need it); every other API call only ever carries the access cookie.
const REFRESH_COOKIE_PATH = "/api/auth";
// Earlier releases scoped the refresh cookie to /api/auth/refresh. A stale
// cookie at that more specific path would be sent ahead of the current one,
// so it is cleared whenever auth cookies are written or removed.
const LEGACY_REFRESH_COOKIE_PATH = "/api/auth/refresh";

function baseOptions() {
  return {
    httpOnly: true,
    sameSite: env.COOKIE_SAMESITE,
    secure: isProduction || env.COOKIE_SAMESITE === "none",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

// `maxAgeMs` is null for "Keep me logged in" unticked: both cookies then
// become browser-session cookies that disappear when the browser closes.
//
// The access cookie deliberately outlives the access token inside it. When
// the JWT expires the browser still sends it, the API answers 401
// TOKEN_EXPIRED, and the admin app silently refreshes. (If the cookie
// expired together with the token, the API would only see "no token" and
// the user would be signed out after 15 minutes.)
export function setAuthCookies(res, { accessToken, refreshToken, maxAgeMs }) {
  const lifetime = maxAgeMs ? { maxAge: maxAgeMs } : {};

  res.cookie(ACCESS_COOKIE, accessToken, { ...baseOptions(), path: "/", ...lifetime });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseOptions(), path: REFRESH_COOKIE_PATH, ...lifetime });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: LEGACY_REFRESH_COOKIE_PATH });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: REFRESH_COOKIE_PATH });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: LEGACY_REFRESH_COOKIE_PATH });
}
