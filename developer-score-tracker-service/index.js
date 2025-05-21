const express = require("express");
const AWS = require("aws-sdk");

const app = express();

AWS.config.update({
  region: "us-east-1",
});

const PORT = 4000;

const tableName = "developer-productivity-tracker-table";

app.get("/", (req, res) => {
  res.send("Developer Productivity Tracker");
});

app.get("/getProductivity", async (req, res) => {
  try {
    const dynamoDB = new AWS.DynamoDB();

    const params = {
      TableName: tableName,
    };

    const data = await dynamoDB.scan(params).promise();

    const extractedValues = data.Items.map((item) => {
      const extractedItem = {};
      for (const key in item) {
        const dataType = Object.keys(item[key])[0];
        extractedItem[key] = item[key][dataType];
      }
      return extractedItem;
    });

    if (extractedValues) {
      res.send(extractedValues);
    } else {
      res.status(404).send("No developers found");
    }
  } catch (error) {
    console.error("Error fetching data from DynamoDB:", error);
    res.status(500).send(error);
  }
});

// Only start the server if this file is run directly, not if it's imported as a module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log("Server Started");
  });
}


module.exports = app;
