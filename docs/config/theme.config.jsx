import {useRouter} from "next/router";

export default {
  darkMode: true,
  logo: (
    <div>
      <span>Buny | IoC Framework</span>
    </div>
  ),
  docsRepositoryBase: "https://github.com/bunyjs/buny/tree/main/docs",
  project: {
    link: "https://github.com/bunyjs/buny",
  },
  primaryHue: 51,
  primarySaturation: 98,
  useNextSeoProps() {
    const {asPath} = useRouter();

    if (asPath !== "/") {
      return {
        titleTemplate: "Buny | %s",
      };
    }
  },
  editLink: {
    text: "Edit this page on GitHub →",
  },
  feedback: {
    content: "Help us improve this page →",
    labels: "documentation",
  },
  footer: {
    text: "MIT © Buny",
  },
  toc: {
    backToTop: true,
  },
  faviconGlyph: "🐰",
};
