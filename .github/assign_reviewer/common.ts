/**
 * Collection of common functions to use in this folder
 */
import core = require("@actions/core");
import github = require("@actions/github");
const token = core.getInput("repo-token");
const octokit = github.getOctokit(token);

const owner = github.context.repo.owner;
const repo = github.context.repo.repo;

export async function wereReviewCommentsAdded(pr, sinceTimeStamp : string) {
    isValidTimestamp(sinceTimeStamp);

    const comments = await octokit.rest.pulls.listReviewComments({
        owner,
        repo,
        pull_number: pr.number,
        since: sinceTimeStamp // todo unsure if this works as expected --> test
      })
      .then(res => {core.info("these comments were retrieved\n" + res); return res;}) // todo log properly w pr number
      .catch(err => {throw err});
    
    return comments.data.length > 0;
}   

function isValidTimestamp(sinceTimeStamp: string) {
    try {
        Date.parse(sinceTimeStamp);
    } catch (err) {
        throw new Error(`the sinceTimeStamp argument passed is an invalid timestamp`);
    }
}
