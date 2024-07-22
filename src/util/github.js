import { Octokit } from "@octokit/rest";

let octokit;

const createOctokit = (token) => {
  octokit = new Octokit({
    auth: token,
  });
}

export const getOctokit = (token) => {
  if (!octokit) {
    if (token) {
      createOctokit(token);
    } else {
      throw new Error('No token provided');
    }
  }

  return octokit;
}
