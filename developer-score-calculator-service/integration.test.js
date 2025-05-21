const AWS = require("aws-sdk");
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("./index");
const expect = chai.expect;

chai.use(chaiHttp);

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

const insertDataToDynamoDB = async (tableName, data) => {
  const params = {
    TableName: tableName,
    Item: data,
  };

  try {
    const result = await dynamoDB.put(params).promise();
    return result;
  } catch (error) {
    throw error;
  }
};

const deleteDataFromDynamoDB = async (tableName, key) => {
  const params = {
    TableName: tableName,
    Key: key,
  };

  try {
    const result = await dynamoDB.delete(params).promise();
    return result;
  } catch (error) {
    throw error;
  }
};

describe("Integration Test for developer-score-calculator-service", () => {

  const tableName = "developer-productivity-tracker-table";
  const testItem = {
    userId: "test-developer",
    prCount: 1,
    commitCount: 4,
    issuesCount: 1,
    reviewsCount: 1,
    discussionCount: 2,
    score: 28,
    scorePercentage: 57,
  };

  before(async () => {
    await insertDataToDynamoDB(tableName, testItem);
  });

  it("should retrieve the inserted data from DynamoDB", async () => {
    const params = {
      TableName: tableName,
      Key: {
        userId: testItem.userId,
      },
    };

    const result = await dynamoDB.get(params).promise();

    expect(result.Item).to.deep.equal(testItem);
  }).timeout(30000);


  it("should return synchronize completion message on / synchronize POST", (done) => {
    chai
      .request(app)
      .post("/synchronize")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal("Synchronization Completed");
        done();
      })
  }).timeout(50000);

  after(async () => {
    // Clean up
    await deleteDataFromDynamoDB(tableName, {
      userId: testItem.userId,
    });
  });
});
