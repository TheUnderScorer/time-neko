const core = require("@actions/core");
const github = require("@actions/github");

function getRepoAndOwner(repoName) {
  return repoName.split("/");
}

/**
 * @return {import('@actions/github').Octokit}
 * */
function getOctokit() {
  return github.getOctokit(core.getInput("githubToken"));
}

/**
 * @return {Promise<import('@actions/github').Octokit.RestEndpointMethods["repos"]["getReleaseByTag"]["response"]["data"]>}
 * */
async function getSourceRelease() {
  const client = getOctokit();

  const [owner, repo] = getRepoAndOwner(core.getInput("privateRepositoryName"));

  return client.rest.repos.getReleaseByTag({
    owner,
    repo,
    tag: core.getInput("tag"),
  });
}

/**
 * @param {import('@actions/github').Octokit.RestEndpointMethods["repos"]["getReleaseByTag"]["response"]["data"]} targetRelease
 * */
async function createReleaseCopy(targetRelease) {
  const client = await getOctokit();

  const [owner, repo] = getRepoAndOwner(core.getInput("publicRepositoryName"));

  const release = await client.rest.repos.createRelease({
    owner,
    repo,
    tag_name: targetRelease.tag_name,
    prerelease: targetRelease.prerelease,
    body: targetRelease.body,
    name: targetRelease.name,
    draft: targetRelease.draft,
  });

  // Upload assets from private release to public
  for (const asset of targetRelease.assets) {
    const data = await client.rest.repos.downloadReleaseAsset({
      owner,
      repo,
      asset_id: asset.id,
    });

    await client.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.data.id,
      name: asset.name,
      data,
    });
  }

  return release.data.html_url;
}

async function main() {
  console.info("Console info test");
  core.info("Core info test");

  const sourceRelease = await getSourceRelease();

  core.info(`Source release: ${sourceRelease.html_url}`);

  const url = await createReleaseCopy(sourceRelease);

  core.setOutput("releaseUrl", url);
}

main().catch((err) => {
  console.error(error);

  core.setFailed(err);
});
