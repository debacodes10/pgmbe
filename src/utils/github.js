import { ApiError } from './api-error.js';
import { StatusCodes } from 'http-status-codes';

export function parseGitHubRepoUrl(repoUrl) {
  let url;

  try {
    url = new URL(repoUrl);
  } catch {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid GitHub repository URL', {
      code: 'INVALID_REPO_URL'
    });
  }

  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Repository URL must use HTTP or HTTPS', {
      code: 'INVALID_REPO_URL'
    });
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only github.com repositories are supported', {
      code: 'UNSUPPORTED_REPO_PROVIDER'
    });
  }

  const segments = url.pathname
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.git$/i, '')
    .split('/');

  if (segments.length !== 2) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'GitHub URL must be in the format https://github.com/{owner}/{repo}', {
      code: 'INVALID_REPO_URL'
    });
  }

  const [owner, repo] = segments;
  const segmentRegex = /^[A-Za-z0-9._-]+$/;

  if (!segmentRegex.test(owner) || !segmentRegex.test(repo)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'GitHub repository owner or name contains invalid characters', {
      code: 'INVALID_REPO_URL'
    });
  }

  return { owner, repo };
}
