const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("./index");
const expect = chai.expect;

chai.use(chaiHttp);

describe("Integration Tests", () => {
  it("should return welcome message on / GET", (done) => {
    chai
      .request(app)
      .get("/")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal("Developer Productivity Tracker");
        done();
      });
  });

  it("should get developer productivity data on /getProductivity GET", (done) => {
    chai
      .request(app)
      .get("/getProductivity")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("array");
        done();
      });
  });
});
