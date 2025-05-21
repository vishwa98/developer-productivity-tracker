const express = require("express");
const axios = require("axios");
const AWS = require("aws-sdk");
require("dotenv").config();

const app = express();

const PORT = 8080;

const repoOwner = "vishwa98";
const repoName = "developer-productivity-tracker-v1";

const tableName = "developer-productivity-tracker-table";

const accessToken = process.env.ACCESS_TOKEN;

AWS.config.update({
  region: "us-east-1",
});

const docClient = new AWS.DynamoDB.DocumentClient();

const fetchAllCommits = async () => {
  try {
    let allCommits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/commits?page=${page}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );

      const commits = response.data;
      if (commits.length === 0) {
        hasMore = false;
      } else {
        allCommits = allCommits.concat(commits);
        page++;
      }

      const linkHeader = response.headers.link;
      if (linkHeader) {
        const nextPageUrl = getNextPageUrl(linkHeader);
        if (nextPageUrl) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const counts = {};
    allCommits.forEach((commit) => {
      const user = commit.author ? commit.author.login : "Unknown";
      counts[user] = counts[user] ? counts[user] + 1 : 1;
    });
    return counts;
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
};

const fetchAllIssues = async () => {
  try {
    let allIssues = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/issues?page=${page}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );

      const issues = response.data;
      if (issues.length === 0) {
        hasMore = false;
      } else {
        allIssues = allIssues.concat(issues);
        page++;
      }

      const linkHeader = response.headers.link;
      if (linkHeader) {
        const nextPageUrl = getNextPageUrl(linkHeader);
        if (nextPageUrl) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const counts = {};
    allIssues.forEach((issue) => {
      const user = issue.user.login;
      counts[user] = counts[user] ? counts[user] + 1 : 1;
    });
    return counts;
  } catch (error) {
    console.error("Error fetching issues:", error);
    return [];
  }
};

const fetchAllReviews = async () => {
  try {
    let allReviews = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all&page=${page}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );

      const pullRequests = response.data;

      if (pullRequests.length === 0) {
        hasMore = false;
      } else {
        for (const pr of pullRequests) {
          const reviews = await fetchReviewsForPullRequest(pr.number);
          allReviews = allReviews.concat(reviews);
        }
        page++;
      }

      const linkHeader = response.headers.link;
      if (linkHeader) {
        const nextPageUrl = getNextPageUrl(linkHeader);
        if (nextPageUrl) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const counts = {};
    allReviews.forEach((review) => {
      const user = review.user.login;
      counts[user] = counts[user] ? counts[user] + 1 : 1;
    });
    return counts;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

const fetchReviewsForPullRequest = async (pullNumber) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${pullNumber}/reviews`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching reviews for pull request:", error);
    return [];
  }
};

const fetchAllPullRequestComments = async () => {
  try {
    let allComments = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/comments?page=${page}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );

      const comments = response.data;

      if (comments.length === 0) {
        hasMore = false;
      } else {
        allComments = allComments.concat(comments);
        page++;
      }

      const linkHeader = response.headers.link;
      if (linkHeader) {
        const nextPageUrl = getNextPageUrl(linkHeader);
        if (nextPageUrl) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const counts = {};
    allComments.forEach((comment) => {
      const user = comment.user.login;
      counts[user] = counts[user] ? counts[user] + 1 : 1;
    });
    return counts;
  } catch (error) {
    console.error("Error fetching pull request comments:", error);
    return [];
  }
};

// Helper function to extract next page URL from the Link header
const getNextPageUrl = (linkHeader) => {
  const links = linkHeader.split(",");
  for (const link of links) {
    const [url, rel] = link.split(";");
    if (rel.includes("next")) {
      return url.trim().slice(1, -1);
    }
  }
  return null;
};

const fetchPullRequests = async () => {
  try {
    let allPullRequests = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all&page=${page}`,
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );

      allPullRequests = allPullRequests.concat(response.data);

      const linkHeader = response.headers.link;
      if (linkHeader) {
        const nextPageUrl = getNextPageUrl(linkHeader);
        hasMore = nextPageUrl !== null;
        if (hasMore) {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    const counts = {};
    allPullRequests.forEach((pr) => {
      const user = pr.user.login;
      counts[user] = counts[user] ? counts[user] + 1 : 1;
    });

    return counts;
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    return [];
  }
};

const calculateProductivity = async (
  prCount,
  commitCount,
  issuesCount,
  reviewsCount,
  discussionCount
) => {
  let users = [];
  let totalScore = 0;

  for (let user in issuesCount) {
    let score =
      1 * issuesCount[user] +
      2 * prCount[user] +
      3 * reviewsCount[user] +
      3 * discussionCount[user] +
      4 * commitCount[user];
    totalScore += score;

    let userData = {
      userId: user,
      prCount: prCount[user],
      commitCount: commitCount[user],
      issuesCount: issuesCount[user],
      reviewsCount: reviewsCount[user],
      discussionCount: discussionCount[user],
      score: score,
    };
    users.push(userData);
  }

  for (let user of users) {
    user.scorePercentage = Math.round((user.score / totalScore) * 100);
  }

  return users;
};

// Function to insert data into DynamoDB
async function insertDataToDynamoDB(userData) {
  try {
    for (const user of userData) {
      const params = {
        TableName: tableName,
        Item: user,
      };
      await docClient.put(params).promise();
      console.log(`Inserted data for userId: ${user.userId}`);
    }
    console.log("Data insertion completed.");
  } catch (err) {
    console.error("Unable to insert data into DynamoDB:", err);
    throw err;
  }
}
const fetchMetrics = async () => {
  try {
    const prCount = await fetchPullRequests();
    const commitCount = await fetchAllCommits();
    const issuesCount = await fetchAllIssues();
    const reviewsCount = await fetchAllReviews();
    const discussionCount = await fetchAllPullRequestComments();

    let productivity = await calculateProductivity(
      prCount,
      commitCount,
      issuesCount,
      reviewsCount,
      discussionCount
    );

    await insertDataToDynamoDB(productivity);
  } catch (err) {
    console.log("Err>>>", err);
    throw err;
  }
};

app.get("/", (req, res) => {
  res.send("Home Page For Metrics Calulation");
});

app.post("/synchronize", async (req, res) => {
  try {
    await fetchMetrics();
    res.send("Synchronization Completed");
  } catch (err) {
    console.log("Err>>>", err);
    res.status(500).send(err);
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("Server Started");
  });
}

module.exports = app;
