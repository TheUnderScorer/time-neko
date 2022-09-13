/*
 * Copyright 2022 Przemysław Żydek
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const core = require('@actions/core');
const devkit = require('@nrwl/devkit');
const { $ } = require('zx');

async function main() {
  const graph = await devkit.createProjectGraphAsync();
  const apps = Object.values(graph.nodes)
    .filter((node) => node.type === 'app')
    .map((node) => node.name);

  core.debug(apps);

  const base = core.getInput('base');
  const head = core.getInput('head');

  const { stdout } =
    await $`npx nx print-affected --base=${base} --head=${head} --select=projects`;
  const affectedProjects = stdout.split(',').map((v) => v.trim());
  const filteredApps = apps.filter((app) => affectedProjects.includes(app));

  core.debug(`Stdout: ${stdout}`);
  core.info(`Affected projects: ${affectedProjects}`);
  core.info(`Filtered apps: ${filteredApps.join(',')}`);

  const result = apps.reduce((acc, project) => {
    const isAffected = affectedProjects.includes(project);

    if (isAffected) {
      acc[project] = true;
    }

    return acc;
  }, {});

  core.setOutput('affected', JSON.stringify(result));
}

main().catch((err) => {
  core.setFailed(err);
});
