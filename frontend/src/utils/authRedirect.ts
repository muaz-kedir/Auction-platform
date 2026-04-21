const POST_AUTH_REDIRECT_KEY = "post_auth_redirect";

const DEFAULT_REDIRECT_PATH = "/dashboard";

const isSafeInternalPath = (path: string) => path.startsWith("/");

export const sanitizeRedirectPath = (path?: string | null) => {
  if (!path) return null;
  return isSafeInternalPath(path) ? path : null;
};

export const savePostAuthRedirect = (path: string) => {
  if (!isSafeInternalPath(path)) return;
  localStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
};

export const readPostAuthRedirect = () => localStorage.getItem(POST_AUTH_REDIRECT_KEY);

export const clearPostAuthRedirect = () => {
  localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
};

export const consumePostAuthRedirect = () => {
  const redirectPath = readPostAuthRedirect();
  clearPostAuthRedirect();
  return redirectPath;
};

export const resolvePostAuthRedirect = (pathnameFromState?: string) => {
  const safePathFromState = sanitizeRedirectPath(pathnameFromState);
  if (safePathFromState) {
    localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return safePathFromState;
  }

  const storedPath = consumePostAuthRedirect();
  const safeStoredPath = sanitizeRedirectPath(storedPath);
  if (safeStoredPath) {
    return safeStoredPath;
  }

  return DEFAULT_REDIRECT_PATH;
};

export const resolvePostAuthRedirectWithQuery = (
  redirectFromQuery?: string | null,
  pathnameFromState?: string,
  allowStoredFallback = true
) => {
  const safeQueryPath = sanitizeRedirectPath(redirectFromQuery);
  if (safeQueryPath) {
    clearPostAuthRedirect();
    return safeQueryPath;
  }

  if (!allowStoredFallback) {
    clearPostAuthRedirect();
    const safePathFromState = sanitizeRedirectPath(pathnameFromState);
    return safePathFromState ?? DEFAULT_REDIRECT_PATH;
  }

  return resolvePostAuthRedirect(pathnameFromState);
};
