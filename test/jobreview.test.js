const JobReview = artifacts.require("JobReview");
const JOBcoin = artifacts.require("JOBcoin");
const JOBcoin = artifacts.require("JOBcoin");
const truffleAssert = require("truffle-assertions");

contract("Jobchain - Job Reviews", (accounts) => {
    let reviewContract;

    beforeEach(async () => {
        jobcoin = await JOBcoin.new("JOBcoin", "JOB", 1000000);
        const tokenInstance = await JOBcoin.deployed();

        const initialBalance = web3.utils.toWei("10", "ether"); // Set initial balance to 10 JOBcoins
        const testUser1 = accounts[1];
        const testUser2 = accounts[2];

        await tokenInstance.transfer(testUser1, initialBalance, { from: accounts[0] });
        await tokenInstance.transfer(testUser2, initialBalance, { from: accounts[0] });


        await tokenInstance.approve(testUser1, initialBalance, { from: accounts[0] });
        await tokenInstance.approve(testUser2, initialBalance, { from: accounts[0] });

        reviewContract = await JobReview.new(tokenInstance.address);
    });

    it("test retrieve review text by review hash", async () => {
        const reviewHash = "0x1234abcd";
        const reviewText = "This is a review.";
        await reviewContract.submitReview("Company XYZ", "Job Title", reviewHash, reviewText, 1000, 5, { from: accounts[0] });
        await reviewContract.submitReview("Company XYZ", "Job Title", reviewHash, reviewText, 1000, 5, { from: accounts[0] });

        const retrievedReviewText = await reviewContract.getReviewText(reviewHash);
        assert.equal(retrievedReviewText, reviewText, "Review text not retrieved correctly");
    });


    it("should submit a review with valid inputs", async () => {
        const companyName = "Company A";
        const jobTitle = "Job Title A";
        const reviewHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
        const salary = 1000;
        const salary = 1000;
        const rating = 4;

        await reviewContract.submitReview(companyName, jobTitle, reviewHash, { from: accounts[0] }, salary, rating);

        const reviewCount = await reviewContract.getReviewsCount();

        assert.equal(reviewCount.toNumber(), 1, "Review count not incremented correctly");

        const review = await reviewContract.reviews(0);

        assert.equal(review.companyName, companyName, "Company name not matching");
        assert.equal(review.jobTitle, jobTitle, "Job title not matching");
        assert.equal(review.reviewHash, reviewHash, "Review hash not matching");
        assert.equal(review.rating.toNumber(), rating, "Rating not matching");

        const events = await reviewContract.getPastEvents("ReviewSubmitted");
        assert.equal(events.length, 1, "ReviewSubmitted event not emitted");
        assert.equal(events[0].args.reviewer, accounts[0], "Reviewer address not matching");
        assert.equal(events[0].args.companyName, companyName, "Company name not matching in event");
        assert.equal(events[0].args.jobTitle, jobTitle, "Job title not matching in event");
        assert.equal(events[0].args.reviewHash, reviewHash, "Review hash not matching in event");
    });

    it("should not submit a review with invalid inputs", async () => {
        try {
            await reviewContract.submitReview("", "Job Title B", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 1000, 3);
            await reviewContract.submitReview("", "Job Title B", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 1000, 3);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Company name must not be empty", "Error message does not match");
        }


        try {
            await reviewContract.submitReview("Company C", "", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 1000, 5);
            await reviewContract.submitReview("Company C", "", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 1000, 5);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Job title must not be empty", "Error message does not match");
        }


        try {
            await reviewContract.submitReview("Company D", "Job Title D", "0x0000000000000000000000000000000000000000000000000000000000000000", { from: accounts[1] }, 1000, 2);
            await reviewContract.submitReview("Company D", "Job Title D", "0x0000000000000000000000000000000000000000000000000000000000000000", { from: accounts[1] }, 1000, 2);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Hash must not be empty", "Error message does not match");
        }

        try {
            await reviewContract.submitReview("Company F", "Job Title F", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 1000, 6);
            await reviewContract.submitReview("Company F", "Job Title F", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 1000, 6);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Invalid rating", "Error message does not match");
        }
    });



    it("should retrieve review text from hash", async () => {
        const companyName = "Company G";
        const jobTitle = "Job Title G";
        const reviewHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
        const rating = 4;
        const reviewText = "This is a sample review text";
        const salary = 1000;
        const salary = 1000;

        await reviewContract.submitReview(companyName, jobTitle, reviewHash, { from: accounts[0] }, salary, rating);

        await reviewContract.setReviewText(0, reviewText, { from: accounts[0] });

        const retrievedReviewText = await reviewContract.getReviewText(reviewHash);

        assert.equal(retrievedReviewText, reviewText, "Review text not retrieved correctly");
    });

    it("should delete a review by reviewer", async () => {
        const companyName = "Company H";
        const jobTitle = "Job Title H";
        const reviewHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
        const rating = 4;
        const salary = 1000;
        const salary = 1000;

        await reviewContract.submitReview(companyName, jobTitle, reviewHash, { from: accounts[0] }, salary, rating);

        let reviewCount = await reviewContract.getReviewsCount();

        assert.equal(reviewCount.toNumber(), 1, "Review count not incremented correctly");

        await reviewContract.deleteReview(0, { from: accounts[0] });

        reviewCount = await reviewContract.getReviewsCount();

        assert.equal(reviewCount.toNumber(), 0, "Review count not decremented correctly");

        await truffleAssert.reverts(
            reviewContract.reviews(0),
            null, // null to ignore expected message
            "Review still exists in the array"
        );
    });
});
