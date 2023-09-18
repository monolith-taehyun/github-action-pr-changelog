export interface Config {
    branch: string;
    title: string;
    prefix: string;
    githubToken: string;
    owner: string;
    repo: string;
    prNumber: number;
}

export interface PullRequest {
    url: string;
    title: string;
    commitSha: string;
}
