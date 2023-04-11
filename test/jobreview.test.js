const JobReview = artifacts.require("JobReview");
const truffleAssert = require("truffle-assertions");

contract("JobReview", (accounts) => {
    let reviewContract; // Declare a variable to hold the contract instance

    // Before each test, deploy a new instance of the contract
    beforeEach(async () => {
        reviewContract = await JobReview.new();
    });

    it("test retrieve review text by review hash", async () => {
        // Create a new review
        const reviewHash = "0x1234abcd";
        const reviewText = "This is a review.";
        await reviewContract.submitReview("Company XYZ", "Job Title", reviewHash, reviewText, 5, { from: accounts[0] });

        // Retrieve review text by review hash
        const retrievedReviewText = await reviewContract.getReviewText(reviewHash);
        assert.equal(retrievedReviewText, reviewText, "Review text not retrieved correctly");
    });


    // Test submitting a review with valid inputs
    it("should submit a review with valid inputs", async () => {
        const companyName = "Company A";
        const jobTitle = "Job Title A";
        const reviewHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
        const rating = 4;

        // Submit a review
        await reviewContract.submitReview(companyName, jobTitle, reviewHash, { from: accounts[0] }, rating);

        // Get the review count
        const reviewCount = await reviewContract.getReviewsCount();

        // Verify that the review count has increased by 1
        assert.equal(reviewCount.toNumber(), 1, "Review count not incremented correctly");

        // Get the review details
        const review = await reviewContract.reviews(0);

        // Verify that the review details match the submitted inputs
        assert.equal(review.companyName, companyName, "Company name not matching");
        assert.equal(review.jobTitle, jobTitle, "Job title not matching");
        assert.equal(review.reviewHash, reviewHash, "Review hash not matching");
        assert.equal(review.rating.toNumber(), rating, "Rating not matching");

        // Check the emitted event
        const events = await reviewContract.getPastEvents("ReviewSubmitted");
        assert.equal(events.length, 1, "ReviewSubmitted event not emitted");
        assert.equal(events[0].args.reviewer, accounts[0], "Reviewer address not matching");
        assert.equal(events[0].args.companyName, companyName, "Company name not matching in event");
        assert.equal(events[0].args.jobTitle, jobTitle, "Job title not matching in event");
        assert.equal(events[0].args.reviewHash, reviewHash, "Review hash not matching in event");
    });

    // Test submitting a review with invalid inputs
    it("should not submit a review with invalid inputs", async () => {
        // Test submitting with empty strings
        try {
            await reviewContract.submitReview("", "Job Title B", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 3);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Company name must not be empty", "Error message does not match");
        }
    
        try {
            await reviewContract.submitReview("Company C", "", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 5);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Job title must not be empty", "Error message does not match");
        }
    
        try {
            await reviewContract.submitReview("Company D", "Job Title D", "0x0000000000000000000000000000000000000000000000000000000000000000", { from: accounts[1] }, 2);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Hash must not be empty", "Error message does not match");
        }
    
    
        // Test submitting with invalid rating
        try {
            await reviewContract.submitReview("Company F", "Job Title F", "0x1234567890123456789012345678901234567890123456789012345678901234", { from: accounts[1] }, 6);
            assert.fail("Expected to fail with 'Invalid inputs', but transaction succeeded");
        } catch (error) {
            assert.include(error.message, "Invalid rating", "Error message does not match");
        }
    });
    

    // Test retrieving review text from hash
    it("should retrieve review text from hash", async () => {
        const companyName = "Company G";
        const jobTitle = "Job Title G";
        const reviewHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
        const rating = 4;
        const reviewText = "This is a sample review text";

        // Submit a review
        await reviewContract.submitReview(companyName, jobTitle, reviewHash, { from: accounts[0] }, rating);

        // Set review text for the submitted review
        await reviewContract.setReviewText(0, reviewText, { from: accounts[0] });

        // Get review text from hash
        const retrievedReviewText = await reviewContract.getReviewText(reviewHash);

        // Verify that the retrieved review text matches the submitted review text
        assert.equal(retrievedReviewText, reviewText, "Review text not retrieved correctly");
    });

    // Test deleting a review by reviewer
    it("should delete a review by reviewer", async () => {
        const companyName = "Company H";
        const jobTitle = "Job Title H";
        const reviewHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
        const rating = 4;

        // Submit a review
        await reviewContract.submitReview(companyName, jobTitle, reviewHash, { from: accounts[0] }, rating);

        // Get the review count
        let reviewCount = await reviewContract.getReviewsCount();

        // Verify that the review count has increased by 1
        assert.equal(reviewCount.toNumber(), 1, "Review count not incremented correctly");

        // Delete the review by reviewer
        await reviewContract.deleteReview(0, { from: accounts[0] });

        // Get the updated review count
        reviewCount = await reviewContract.getReviewsCount();

        // Verify that the review count has decreased by 1
        assert.equal(reviewCount.toNumber(), 0, "Review count not decremented correctly");

        // Try to retrieve the deleted review
        await truffleAssert.reverts(
            reviewContract.reviews(0),
            null, // null to ignore expected message
            "Review still exists in the array"
        );
    });
});
