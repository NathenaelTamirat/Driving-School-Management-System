// PostCSS configuration for the Driving School client.
// Uses Tailwind CSS v4's official PostCSS plugin (@tailwindcss/postcss).
// There are no additional PostCSS plugins (no autoprefixer needed because
// Tailwind v4 handles vendor prefixes through its own build step).

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
