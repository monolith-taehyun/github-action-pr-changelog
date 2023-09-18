import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";
import { Config, PullRequest } from "./types";

const PULL_REQUEST_STATE = "closed";
const RESULTS_PER_PAGE = 100;

export class Changelog {
    private commits: Array<string>;
    private commitPage: number;
    private config: Config;
    private latestTagsCommit: string;
    private octokit: Octokit;
    private pullRequests: Array<PullRequest>;
    private pullRequestPage: number;
    private branch: string;
    private title: string;
    private prefix: string;
    private changelogBody: string;

    public constructor(config: Config) {
        this.commits = [];
        this.commitPage = 0;
        this.config = config;
        this.latestTagsCommit = "";
        this.octokit = new Octokit({
            auth: config.githubToken,
        });
        this.pullRequests = [];
        this.pullRequestPage = 0;
        this.branch = "";
        this.title = config.title;
        this.prefix = config.prefix;
        this.changelogBody = "";
    }

    /**
     * Get changelog from title and changelog body
     */
    public get changelog(): string {
        return `${this.title}\n${this.changelogBody}`;
    }

    /**
     * Check if changelog is empty
     */
    public get isEmpty(): boolean {
        if (this.changelogBody) return false;
        return true;
    }

    /**
     * Run main logic
     */
    public async run(): Promise<void> {
        await this.setBranch();
        await this.getCurrentPullRequest();
    }

    private async setBranch(): Promise<void> {
        if (!this.branch) {
            const repository: any = await this.octokit.rest.repos.get({
                owner: this.config.owner,
                repo: this.config.repo,
            });
            this.branch = repository.default_branch;
        }
    }

    private async getCurrentPullRequest(): Promise<void> {
        const pr = await this.octokit.rest.pulls.get({
            owner: this.config.owner,
            repo: this.config.repo,
            pull_number: this.config.prNumber,
        });

        core.info("current pr = " + JSON.stringify(pr, null, 2));
        const prCommitSha: any = pr.data.merge_commit_sha;

        let changelogBody = pr.data.title;

        // 기존 changelog 내용 조회
        if ("merge_commit_sha" in pr.data)
            changelogBody += await this.getChangelogFileContent(prCommitSha);

        core.info("\nchangeLogBody=" + changelogBody);
        core.info("===============================");
        this.changelogBody = changelogBody;
    }

    private async getChangelogFileContent(commitSha: string) {
        let contents = "";
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.config.owner,
                repo: this.config.repo,
                path: "CHANGELOG.md",
                ref: commitSha,
            });

            core.info("\nresponse=" + JSON.stringify(response, null, 2));

            if (Array.isArray(response.data)) {
                console.error("The specified path is a directory.");
            } else if ("content" in response.data) {
                contents = Buffer.from(
                    response.data.content,
                    "base64"
                ).toString();
                console.log("File Content:", contents);
            } else {
                console.error("File content not found in the response.");
            }
        } catch (error) {
            console.error("Error:", (error as { message: string }).message);
        }
        return contents;
    }
}
