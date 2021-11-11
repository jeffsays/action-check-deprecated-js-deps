import npmQuery, { VersionNotFoundError } from "package-json";
import * as semver from "semver";
import * as core from "@actions/core";

/**
 *
 * @param {Map<string, {file: string, type: 'dependencies' | 'devDependencies' | 'resolutions', version: string}[]>} allDeps
 */
export default async function checkDeprecations(allDeps) {
  const ignore =
    core.getInput("ignore", {
      required: false
    }) || "";
  const modulesToIgnore = new Set(ignore.split(/\s*,\s*/g).filter(v => v));

  /** @type {Set<string>} */
  const deprecated = new Set();

  for (const [name, pkgs] of allDeps) {
    const tag = pkgs.find(({ version }) => !semver.valid(version));
    const latestUsedVersion = tag
      ? tag.version
      : pkgs.sort((p1, p2) => (semver.gte(p1.version, p2.version) ? -1 : 1))[0]
          .version;

    /** @type {npmQuery.AbbreviatedMetadata} */
    let pi;
    try {
      pi = await npmQuery(name, {
        version: latestUsedVersion
      });
    } catch (err) {
      core.debug(err.message);
      if (err instanceof VersionNotFoundError)
        pi = await npmQuery(name, {
          version: "latest"
        });
    }
    if (pi && pi.deprecated) {
      core.warning(`📦  \x1b[1m\x1b[31m${name}\x1b[0m: ${pi.deprecated}`);
      for (const pk of pkgs) {
        core.info(`\t ${pk.file} [${pk.type}]: ${pk.version}`);
      }
      if (modulesToIgnore.has(name))
        core.warning(`Ignoring deprecation of ${name}...`);
      else {
        for (const pk of pkgs) {
          deprecated.add(`- **[${pk.type}] [${name}](https://www.npmjs.com/package/${name})@${pk.version}**: ${pi.deprecated}`);
        }
      }
    }
  }
  return deprecated;
}
