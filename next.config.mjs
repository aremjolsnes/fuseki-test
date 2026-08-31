/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ship the committed baseline queries with the serverless functions so
  // listQueries() can read them on Vercel (where the rest of the FS is absent).
  outputFileTracingIncludes: {
    "/api/**": ["./queries/**"],
    "/report/**": ["./queries/**"],
  },
};

export default nextConfig;
