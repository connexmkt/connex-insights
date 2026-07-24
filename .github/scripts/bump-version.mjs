#!/usr/bin/env node
// Calcula a próxima versão semântica a partir dos Conventional Commits
// desde a última tag "vX.Y.Z", atualiza o package.json, gera/atualiza o
// CHANGELOG.md e expõe o resultado via $GITHUB_OUTPUT.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ConventionalChangelog } from "conventional-changelog";
import { Bumper } from "conventional-recommended-bump";
import semver from "semver";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PACKAGE_JSON_PATH = `${REPO_ROOT}/package.json`;
const CHANGELOG_PATH = `${REPO_ROOT}/CHANGELOG.md`;
const TAG_PREFIX = "v";
const CHANGELOG_HEADER = "# Changelog\n";

function writeOutputs(outputs) {
  const serialized = Object.entries(outputs)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${serialized}\n`);
  } else {
    console.log(serialized);
  }
}

function prependChangelog(newSection) {
  const trimmedSection = newSection.trim();
  const existing = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, "utf8") : "";
  const withoutHeader = existing.replace(/^#\s+Changelog\s*\n+/, "");

  return `${CHANGELOG_HEADER}\n${trimmedSection}\n\n${withoutHeader}`.trimEnd() + "\n";
}

async function main() {
  const bumper = new Bumper().loadPreset("conventionalcommits").tag({ prefix: TAG_PREFIX });

  const recommendation = await bumper.bump();

  if (!recommendation.releaseType) {
    console.log("Nenhum commit relevante (feat/fix/breaking change) desde a última tag. Nenhuma release será gerada.");
    writeOutputs({ released: "false" });
    return;
  }

  const { releaseType } = recommendation;

  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8").replace(/^\uFEFF/, ""));
  const nextVersion = semver.inc(packageJson.version, releaseType);

  if (!nextVersion) {
    throw new Error(
      `Não foi possível calcular a próxima versão a partir de "${packageJson.version}" com o tipo "${releaseType}".`,
    );
  }

  packageJson.version = nextVersion;
  writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);

  const changelogGenerator = new ConventionalChangelog()
    .loadPreset("conventionalcommits")
    .readPackage(PACKAGE_JSON_PATH)
    .tags({ prefix: TAG_PREFIX });

  let newChangelogSection = "";
  for await (const chunk of changelogGenerator.write()) {
    newChangelogSection += chunk;
  }

  writeFileSync(CHANGELOG_PATH, prependChangelog(newChangelogSection));

  writeOutputs({
    released: "true",
    version: nextVersion,
    tag: `${TAG_PREFIX}${nextVersion}`,
    releaseType,
  });

  console.log(`Nova versão calculada: ${nextVersion} (${releaseType})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
