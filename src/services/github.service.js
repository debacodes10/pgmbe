import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { parseGitHubRepoUrl } from '../utils/github.js';

export async function fetchLatestGitHubCommit(repoUrl) {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.GITHUB_TIMEOUT_MS);

  try {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'pgm-backend'
    };

    if (env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`,
      {
        method: 'GET',
        headers,
        signal: controller.signal
      }
    );

    if (response.status === 404) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'GitHub repository not found or is private', {
        code: 'REPO_NOT_FOUND_OR_PRIVATE'
      });
    }

    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0' || response.status === 429) {
        throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'GitHub API rate limit exceeded', {
          code: 'GITHUB_RATE_LIMIT'
        });
      }
    }

    if (response.status === 409) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Repository has no commits', {
        code: 'NO_COMMITS'
      });
    }

    if (!response.ok) {
      throw new ApiError(StatusCodes.BAD_GATEWAY, 'GitHub API request failed', {
        code: 'GITHUB_API_ERROR',
        details: [{ status: response.status }]
      });
    }

    const commits = await response.json();

    if (!Array.isArray(commits) || commits.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Repository has no commits', {
        code: 'NO_COMMITS'
      });
    }

    const latest = commits[0];
    const commitDate = latest?.commit?.committer?.date;

    if (!commitDate) {
      throw new ApiError(StatusCodes.BAD_GATEWAY, 'GitHub API response missing commit date', {
        code: 'GITHUB_API_ERROR'
      });
    }

    return {
      owner,
      repo,
      lastCommitAt: new Date(commitDate),
      sha: latest.sha,
      htmlUrl: latest.html_url ?? null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError(StatusCodes.GATEWAY_TIMEOUT, 'GitHub API request timed out', {
        code: 'GITHUB_TIMEOUT'
      });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
