const JobReview = artifacts.require("JobReview");
const JOBcoin = artifacts.require("JOBcoin");
const truffleAssert = require("truffle-assertions");
const web3Utils = require('web3-utils');



contract("Jobchain - composed", accounts => {
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

    it("should get all reviews of a job listing", async () => {
        // Add some reviews and job listings
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        await contract.createJobListing("Company B", "Job Title A", "Description B", { from: accounts[1] });
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);
        await contract.createReview(1, web3.utils.keccak256("Hash B"), "Text B", 6000, 4);
        await contract.createReview(1, web3.utils.keccak256("Hash C"), "Text C", 7000, 3);

        // Get reviews of a job listing and check the result
        let reviews = await contract.getAllReviewsOfJobListing(0);
        assert.equal(reviews.length, 1, "Number of reviews should be 1");
        assert.equal(reviews[0].companyName, "Company A", "Company name should match");
        assert.equal(reviews[0].jobTitle, "Job Title A", "Job title should match");
    });

    it("should get all reviews written by a certain reviewer", async () => {
        // Add some reviews and job listings
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        await contract.createJobListing("Company B", "Job Title A", "Description B", { from: accounts[1] });
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);
        await contract.createReview(1, web3.utils.keccak256("Hash B"), "Text B", 6000, 4);
        await contract.createReview(1, web3.utils.keccak256("Hash C"), "Text C", 7000, 3);

        // Get reviews written by a certain reviewer and check the result
        let reviews = await contract.getAllReviewsByReviewer(accounts[0]);
        assert.equal(reviews.length, 3, "Number of reviews should be 1");
        assert.equal(reviews[0].companyName, "Company A", "Company name should match");
        assert.equal(reviews[0].jobTitle, "Job Title A", "Job title should match");
    });

    it("should get average, minimum and maximum salary of a company", async () => {
        // Add some reviews and job listings
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        await contract.createJobListing("Company B", "Job Title A", "Description B", { from: accounts[1] });
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);
        await contract.createReview(1, web3.utils.keccak256("Hash B"), "Text B", 6000, 4);
        await contract.createReview(1, web3.utils.keccak256("Hash C"), "Text C", 7000, 3);

        // Get average, minimum, and maximum salary of a company and check the result
        let companyASalaryStats = await contract.getCompanySalaryStats("Company A");
        assert.equal(companyASalaryStats[0], 5000, "Average salary should be 5000");
        assert.equal(companyASalaryStats[1], 5000, "Minimum salary should be 5000");
        assert.equal(companyASalaryStats[2], 5000, "Maximum salary should be 5000");

        let companyBSalaryStats = await contract.getCompanySalaryStats("Company B");
        assert.equal(companyBSalaryStats[0], 6500, "Average salary should be 6500");
        assert.equal(companyBSalaryStats[1], 6000, "Minimum salary should be 6000");
        assert.equal(companyBSalaryStats[2], 7000, "Maximum salary should be 7000");
    });

    it("should delete a review", async () => {
        // Add some reviews and job listings
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        await contract.createJobListing("Company B", "Job Title A", "Description B", { from: accounts[1] });
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);
        await contract.createReview(1, web3.utils.keccak256("Hash B"), "Text B", 6000, 4);
        await contract.createReview(1, web3.utils.keccak256("Hash C"), "Text C", 7000, 3);

        // Delete a review and check the result
        await contract.deleteReview(0);
        let reviews = await contract.getAllReviewsOfJobListing(0);
        assert.equal(reviews.length, 0, "Number of reviews should be 0 after deletion");
    });

    it("should update a review", async () => {
        // Add some reviews and job listings
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        await contract.createJobListing("Company B", "Job Title A", "Description B", { from: accounts[1] });
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);
        await contract.createReview(1, web3.utils.keccak256("Hash B"), "Text B", 6000, 4);
        await contract.createReview(1, web3.utils.keccak256("Hash C"), "Text C", 7000, 3);

        // Update a review and check the result
        await contract.updateReview(0, web3.utils.keccak256("Hash A"), "Text A - updated", 4000, 3);
        let review = await contract.getReview(0);
        const retrievedReviewText = await contract.getReviewText(review[3]);

        assert.equal(retrievedReviewText, "Text A - updated", "Review text should be updated");
        assert.equal(review[4].toNumber(), 4000, "Review salary should be updated");
        assert.equal(review[5].toNumber(), 3, "Review rating should be updated");
    });

    it("should emit an event when a review is created", async () => {
        // Add a job listing
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });

        // Submit a review and check the emitted event

        let result = await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);
        assert.equal(result.logs.length, 1, "One event should be emitted");
        assert.equal(result.logs[0].event, "ReviewSubmitted", "ReviewSubmitted event should be emitted");
        assert.equal(result.logs[0].args.reviewId.toNumber(), 0, "Review ID should be correct");
        assert.equal(result.logs[0].args.companyName, "Company A", "Company should be correct");
        assert.equal(result.logs[0].args.jobTitle, "Job Title A", "Job title should be correct");
        assert.equal(result.logs[0].args.reviewHash, web3.utils.keccak256("Hash A"), "Hash should be correct");
        assert.equal(result.logs[0].args.reviewText, "Text A", "Text should be correct");
        assert.equal(result.logs[0].args.salary.toNumber(), 5000, "Salary should be correct");
        assert.equal(result.logs[0].args.rating.toNumber(), 5, "Rating should be correct");
    });

    it("should emit an event when a review is updated", async () => {
        // Add a job listing and submit a review
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);

        // Update the review and check the emitted event
        let result = await contract.updateReview(0, web3.utils.keccak256("Hash A"), "Text A - updated", 4000, 3);
        assert.equal(result.logs.length, 1, "One event should be emitted");
        assert.equal(result.logs[0].event, "ReviewUpdated", "ReviewUpdated event should be emitted");
        assert.equal(result.logs[0].args.reviewId.toNumber(), 0, "Review ID should be correct");
        assert.equal(result.logs[0].args.companyName, "Company A", "Company should be correct");
        assert.equal(result.logs[0].args.jobTitle, "Job Title A", "Job title should be correct");
        assert.equal(result.logs[0].args.reviewHash, web3.utils.keccak256("Hash A"), "Hash should be correct");
        assert.equal(result.logs[0].args.reviewText, "Text A - updated", "Text should be correct");
        assert.equal(result.logs[0].args.salary.toNumber(), 4000, "Salary should be correct");
        assert.equal(result.logs[0].args.rating.toNumber(), 3, "Rating should be correct");
    });

    it("should emit an event when a review is deleted", async () => {
        // Add a job listing and submit a review
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);

        // Delete the review and check the emitted event
        let result = await contract.deleteReview(0);
        assert.equal(result.logs.length, 1, "One event should be emitted");
        assert.equal(result.logs[0].event, "ReviewDeleted", "ReviewDeleted event should be emitted");
        assert.equal(result.logs[0].args.reviewId.toNumber(), 0, "Review ID should be correct");
    });

    it("should delete job listing and associated reviews", async () => {
        await contract.createJobListing("Company A", "Job Title A", "Description A", { from: accounts[1] });
        let jobListingCountBefore = await contract.getJobListingsCount();

        // Create reviews associated with the job listing
        await contract.createReview(0, web3.utils.keccak256("Hash A"), "Text A", 5000, 5);
        await contract.createReview(0, web3.utils.keccak256("Hash B"), "Text B", 6000, 4);
        let reviewCountBefore = await contract.getReviewsCount();

        // Delete the job listing
        await contract.deleteJobListing(0);
        let jobListingCountAfter = await contract.getJobListingsCount();

        // Check that job listing count is decremented by 1
        assert.equal(
            jobListingCountAfter.toNumber(),
            jobListingCountBefore.toNumber() - 1,
            "Job listing count should be decremented by 1"
        );

        // Check that reviews associated with the job listing are deleted
        let reviewCountAfter = await contract.getReviewsCount();
        assert.equal(
            reviewCountAfter.toNumber(),
            reviewCountBefore.toNumber() - 2,
            "Review count should be decremented by 2"
        );
    });


});
