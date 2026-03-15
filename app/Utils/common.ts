export const getenv = (key: string, fallback = ""): string => {
  const val = process.env[key];
  return val === undefined ? fallback : val;
};
