const JobReview = artifacts.require("JobReview");
const JOBcoin = artifacts.require("JOBcoin");
const truffleAssert = require("truffle-assertions");

contract("Jobchain - Job Listings", (accounts) => {
  let contract;
  let jobcoin;

  beforeEach(async () => {
    jobcoin = await JOBcoin.new("JOBcoin", "JOB", 1000000);
    const tokenInstance = await JOBcoin.deployed();

    contract = await JobReview.new(tokenInstance.address);

    // Transfer JOBcoins to test users
     // Set initial balance to 100 JOBcoins
    const initialBalance = web3.utils.toWei("10", "ether");
    const initialApprove = web3.utils.toWei("100", "ether");

    const testUser1 = accounts[1];

    await tokenInstance.approve(contract.address, initialApprove, { from: testUser1 });

    await tokenInstance.transfer(testUser1, initialBalance, { from: accounts[0] });

    await contract.addAuthorizedLister(testUser1);


});

  it("should create a job listing", async () => {
    const companyName = "Company A";
    const jobTitle = "Software Engineer";
    const jobDescription = "We are looking for a skilled software engineer";

    await contract.createJobListing(companyName, jobTitle, jobDescription, { from: accounts[1] });

    const retrievedJob = await contract.getJobListing(0);

    assert.equal(retrievedJob[0], companyName, "Company name should match");
    assert.equal(retrievedJob[1], jobTitle, "Job title should match");
    assert.equal(retrievedJob[2], jobDescription, "Job description should match");
  });

  it("should update a job listing", async () => {
    const companyName = "Company B";
    const jobTitle = "Product Manager";
    const jobDescription = "We are looking for an experienced product manager...";

    await contract.createJobListing(companyName, jobTitle, jobDescription, { from: accounts[1] });

    const newCompanyName = "Company C";
    const newJobTitle = "Data Scientist";
    const newJobDescription = "We are seeking a data scientist with expertise in...";

    await contract.updateJobListing(0, newCompanyName, newJobTitle, newJobDescription);

    const retrievedJob = await contract.getJobListing(0);

    assert.equal(retrievedJob[0], newCompanyName, "Company name should match");
    assert.equal(retrievedJob[1], newJobTitle, "Job title should match");
    assert.equal(retrievedJob[2], newJobDescription, "Job description should match");
  });

  it("should delete a job listing", async () => {
    const companyName = "Company D";
    const jobTitle = "UX Designer";
    const jobDescription = "We are looking for a talented UX designer...";

    await contract.createJobListing(companyName, jobTitle, jobDescription, { from: accounts[1] });

    await contract.deleteJobListing(0, { from: accounts[1] });

    // Try to retrieve the deleted job listing
    try {
      await contract.getJobListing(0, { from: accounts[0] });
      assert.fail("Expected an error, but none was thrown");
    } catch (error) {
      assert.include(error.message, "Index out of range", "Error message should indicate job listing not found");
    }
  });

  
});
