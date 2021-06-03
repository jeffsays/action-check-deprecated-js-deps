import core from "@actions/core";
import getAllDeps from "./get-all-deps";
import checkForDeprecations from "./check-deprecations";

async function run() {
  try {
    const allDeps = getAllDeps();
    core.debug(JSON.stringify([...allDeps]));
    const deprecations = await checkForDeprecations(allDeps);
    core.setOutput("deprecated", [...deprecations].join("\n"));
    if (deprecations.size) {
      core.warning(`Deprecated: ${[...deprecations].join("\n")}`);
    } else {
      core.setOutput(
        "deprecated",
        "✅ Checked dependencies and no deprecated dependencies found"
      );
      console.info(
        "✅ Checked %d dependencies and no deprecated dependencies found",
        allDeps.size
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
