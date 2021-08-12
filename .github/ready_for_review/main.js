const core = require("@actions/core");
const github = require("@actions/github");
const { log, postComment, getPRHeadShaForIssueNumber, validateChecks, dropOngoingLabelAndAddToReview } = require("../../lib/.github/common");
const reviewKeywords = "@bot ready for review";

// todo should become class params
const token = core.getInput("repo-token");
const octokit = github.getOctokit(token);

core.info("Octokit has been set up");

// params to set
// check https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts to figure out what's being responded
const owner = github.context.repo.owner;
const repo = github.context.repo.repo;
const issueNum = github.context.issue.number;

/**
 * this is the main function of this file
 */
async function run() {
    try {
        // all comments trigger this workflow
        const doesCommentContainKeywords = filterCommentBody();
        if (!doesCommentContainKeywords) return;

        const valid = await validate();
        if (!valid) return;

        await dropOngoingLabelAndAddToReview();
    } catch (ex) {
        core.info(ex);
        core.setFailed(ex.message);
    }
}

// return if comment body has the exact keywords
function filterCommentBody() {
    const issueComment = github.context.payload.comment.body;
    const hasKeywords = issueComment.search(reviewKeywords) !== -1;

    core.info(`issueComment: ${issueComment}`);
    core.info(`keywords found in issue? ${hasKeywords}`);

    return hasKeywords;
}

/**
 * Wrapper function for all validation related checks. If any fail, this function handles adding the comment 
 * @returns boolean of whether all validation checks 
 */
async function validate() {
    if (!validatePRStatus()) return; // todo make sure this action doesn't run on pr's that are closed, or are of certain labels (exclude s.ToReview?)

    const sha = await getPRHeadShaForIssueNumber(issueNum);

    const { didChecksRunSuccessfully: checksRunSuccessfully, errMessage } = await validateChecks(sha);
    log.info(checksRunSuccessfully, "checksRunSuccessfully");

    if (!checksRunSuccessfully) {
        await postComment(errMessage);
        return false;
    }

    return true;
}


function validatePRStatus() {
    core.warning("no pr validation has been set");
    return true;
}

run();
