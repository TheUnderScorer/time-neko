const core = require('@actions/core');

async function main() {
  const tag = core.getInput('tag');
  const envFromInput = core.getInput('envFromInput');

  core.debug(`tag: ${tag}`);

  if (envFromInput) {
    core.setOutput('env', envFromInput);

    return;
  }

  if (tag) {
    const isTest = tag.includes('test');

    core.setOutput('env', isTest ? 'staging' : 'production');

    return;
  }

  core.setOutput('env', 'development');
}

main().catch((err) => {
  core.setFailed(err);
});
