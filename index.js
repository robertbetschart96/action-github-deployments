const core = require("@actions/core");
const github = require("@actions/github");

function repository() {
  return process.env.GITHUB_REPOSITORY.split("/");
}

function createClient() {
  const token = core.getInput("token", { required: true });
  return new github.GitHub(token);
}

function setOutputs({ id, task, payload, environment, state }) {
  core.setOutput("id", id);
  core.setOutput("task", task);
  core.setOutput("payload", JSON.stringify(payload));
  core.setOutput("environment", environment);
  core.setOutput("state", state || "pending");
}

async function createDeployment() {
  const [owner, repo] = repository();
  const ref = core.getInput("ref", { required: true });
  const environment = core.getInput("environment");
  const description = core.getInput("description");
  const transient = core.getInput("transient");
  const interactive = core.getInput("interactive");

  const octokit = createClient();

  const { data: deployment } = await octokit.repos.createDeployment({
    owner,
    repo,
    ref,
    environment,
    description,
    required_contexts: [],
    transient_environment: transient && transient === "true",
    production_environment: interactive && interactive === "true",
    mediaType: {
      previews: ["ant-man", "flash"]
    }
  });

  setOutputs(deployment);
}

async function updateStatus() {
  const [owner, repo] = repository();
  const deployment_id = core.getInput("id", { required: true });
  const state = core.getInput("state", { required: true });
  const description = core.getInput("description");

  const octokit = createClient();

  const { data: deployment } = await octokit.repos.createDeploymentStatus({
    owner,
    repo,
    deployment_id,
    state,
    description,
    mediaType: {
      previews: ["ant-man", "flash"]
    }
  });

  setOutputs(deployment);
}

(async () => {
  try {
    const action = core.getInput("action");

    switch (action) {
      case "update":
        await updateStatus();
        break;
      default:
        await createDeployment();
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
