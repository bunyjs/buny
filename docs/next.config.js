import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./config/theme.config.jsx",
});

export default withNextra({
  output: "export",
  images: {
    unoptimized: true,
  },
});
