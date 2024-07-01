import type {PluginImpl} from "rollup";
import MagicString from "magic-string";
import fastGlob from "fast-glob";
import path from "path";
import {normalize} from "rosetil";

const globImporter: PluginImpl = () => {
  const mapImporter = new Map<string, string>();

  return {
    name: "buny:importer:glob",
    resolveId: (source, importer) => {
      if (!importer) {
        return null;
      }

      if (mapImporter.has(importer)) {
        const importerDir = path.dirname(mapImporter.get(importer));

        return {
          id: path.resolve(importerDir, source),
          external: false,
        };
      }

      if (source.startsWith("glob:")) {
        const pattern = source.slice(5);

        if (!fastGlob.isDynamicPattern(pattern)) {
          return null;
        }

        mapImporter.set(source, importer);

        return source;
      }
    },
    load: async (id) => {
      if (mapImporter.has(id)) {
        const importer = mapImporter.get(id);
        const importerDir = path.dirname(importer);
        const pattern = id.slice(5);

        const files = await fastGlob(pattern, {
          cwd: importerDir,
          onlyFiles: true,
          absolute: true,
        });

        const magicString = new MagicString("export {};");

        for (const file of files) {
          const fileRelative = path.relative(importerDir, file);
          magicString.prepend(`import "./${normalize(fileRelative)}";\n`);
        }

        return {
          code: magicString.toString(),
          map: magicString.generateMap({
            hires: true,
          }),
        };
      }
    },
  };
};

export {
  globImporter,
};
