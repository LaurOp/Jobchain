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
    const initialBalance = web3.utils.toWei("10", "ether"); // Set initial balance to 100 JOBcoins
    const initialApprove = web3.utils.toWei("100", "ether"); // Set initial allowance to 100 JOBcoins

    const testUser1 = accounts[1];


    await tokenInstance.approve(contract.address, initialApprove, { from: testUser1 });

    await tokenInstance.transfer(testUser1, initialBalance, { from: accounts[0] });

    await contract.addAuthorizedLister(testUser1);


});

  it("should create a job listing", async () => {
    const companyName = "Company A";
    const jobTitle = "Software Engineer";
    const jobDescription = "We are looking for a skilled software engineer";

    // Create a job listing
    await contract.createJobListing(companyName, jobTitle, jobDescription, { from: accounts[1] });

    // Retrieve the job listing
    const retrievedJob = await contract.getJobListing(0);

    // Assert that the retrieved job has the expected values
    assert.equal(retrievedJob[0], companyName, "Company name should match");
    assert.equal(retrievedJob[1], jobTitle, "Job title should match");
    assert.equal(retrievedJob[2], jobDescription, "Job description should match");
  });

  it("should update a job listing", async () => {
    const companyName = "Company B";
    const jobTitle = "Product Manager";
    const jobDescription = "We are looking for an experienced product manager...";

    // Create a job listing
    await contract.createJobListing(companyName, jobTitle, jobDescription, { from: accounts[1] });

    // Update the job listing
    const newCompanyName = "Company C";
    const newJobTitle = "Data Scientist";
    const newJobDescription = "We are seeking a data scientist with expertise in...";

    await contract.updateJobListing(0, newCompanyName, newJobTitle, newJobDescription);

    // Retrieve the updated job listing
    const retrievedJob = await contract.getJobListing(0);

    // Assert that the retrieved job has the updated values
    assert.equal(retrievedJob[0], newCompanyName, "Company name should match");
    assert.equal(retrievedJob[1], newJobTitle, "Job title should match");
    assert.equal(retrievedJob[2], newJobDescription, "Job description should match");
  });

  it("should delete a job listing", async () => {
    const companyName = "Company D";
    const jobTitle = "UX Designer";
    const jobDescription = "We are looking for a talented UX designer...";

    // Create a job listing
    await contract.createJobListing(companyName, jobTitle, jobDescription, { from: accounts[1] });

    // Delete the job listing
    await contract.deleteJobListing(0);

    // Try to retrieve the deleted job listing
    try {
      await contract.getJobListing(0);
      // If the above line does not throw an error, the test should fail
      assert.fail("Expected an error, but none was thrown");
    } catch (error) {
      // Assert that the error message indicates the job listing was not found
      assert.include(error.message, "Index out of range", "Error message should indicate job listing not found");
    }
  });
});
