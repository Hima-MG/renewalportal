// Excludes visually ambiguous characters (0/O, 1/I/L) so tokens are easy to
// read back from a screenshot or copy-paste without transcription errors.
const TOKEN_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const TRACKING_TOKEN_LENGTH = 10;

export function generateTrackingToken(): string {
  const randomValues = new Uint32Array(TRACKING_TOKEN_LENGTH);
  crypto.getRandomValues(randomValues);

  let token = "";
  for (const value of randomValues) {
    token += TOKEN_CHARSET[value % TOKEN_CHARSET.length];
  }
  return token;
}
