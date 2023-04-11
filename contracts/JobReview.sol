pragma solidity ^0.8.0;

contract JobReview {
    struct Review {
        uint id;
        address reviewer;
        string companyName;
        string jobTitle;
        bytes32 reviewHash;
        string reviewText;
        uint8 rating;
    }

    struct JobListing {
        string companyName;
        string jobTitle;
        uint256 salary;
    }

    Review[] public reviews;
    JobListing[] public jobListings;

    mapping(address => bool) public authorizedListers;

    address public owner;

    event JobListingCreated(
        string companyName,
        string jobTitle,
        uint256 salary
    );
    event ReviewSubmitted(
        address indexed reviewer,
        string companyName,
        string jobTitle,
        bytes32 reviewHash,
        string reviewText,
        uint8 rating
    );
    event ReviewDeleted(
        address indexed reviewer,
        string companyName,
        string jobTitle,
        bytes32 reviewHash
    );

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner can call this function"
        );
        _;
    }

    modifier onlyAuthorizedLister() {
        require(
            authorizedListers[msg.sender],
            "Only authorized listers can call this function"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createJobListing(
        string memory _companyName,
        string memory _jobTitle,
        uint256 _salary
    ) public onlyAuthorizedLister {
        JobListing memory newJob = JobListing(_companyName, _jobTitle, _salary);
        jobListings.push(newJob);
        emit JobListingCreated(_companyName, _jobTitle, _salary);
    }

    uint counter = 0;

    function submitReview(
        string memory _companyName,
        string memory _jobTitle,
        bytes32 _reviewHash,
        string memory _reviewText,
        uint8 _rating
    ) public {
        require(
            bytes(_companyName).length > 0,
            "Company name must not be empty"
        );
        require(bytes(_jobTitle).length > 0, "Job title must not be empty");

        require(_reviewHash != bytes32(0), "Hash must not be empty");
        require(_rating >= 1 && _rating <= 5, "Invalid rating");

        Review memory newReview = Review(
            counter++,
            msg.sender,
            _companyName,
            _jobTitle,
            _reviewHash,
            _reviewText,
            _rating
        );
        reviews.push(newReview);
        emit ReviewSubmitted(
            msg.sender,
            _companyName,
            _jobTitle,
            _reviewHash,
            _reviewText,
            _rating
        );
    }

    function getJobListingsCount() public view returns (uint256) {
        return jobListings.length;
    }

    function getJobListing(
        uint256 _index
    ) public view returns (string memory, string memory, uint256) {
        require(_index < jobListings.length, "Index out of range");
        JobListing memory job = jobListings[_index];
        return (job.companyName, job.jobTitle, job.salary);
    }

    function getReviewsCount() public view returns (uint256) {
        return reviews.length;
    }

    function getReview(
        uint256 _index
    ) public view returns (address, string memory, string memory, bytes32) {
        require(_index < reviews.length, "Index out of range");
        Review memory review = reviews[_index];
        return (
            review.reviewer,
            review.companyName,
            review.jobTitle,
            review.reviewHash
        );
    }

    function getReviewText(
        bytes32 _reviewHash
    ) public view returns (string memory) {
        for (uint256 i = 0; i < reviews.length; i++) {
            if (reviews[i].reviewHash == _reviewHash) {
                return reviews[i].reviewText;
            }
        }
        revert("Review not found");
    }

    function deleteReview(uint256 _index) public {
        require(_index < reviews.length, "Index out of range");
        Review memory reviewToDelete = reviews[_index];
        require(
            reviewToDelete.reviewer == msg.sender,
            "Only review owner can delete the review"
        );

        // Move the last element to the position of the element to be deleted
        Review memory lastReview = reviews[reviews.length - 1];
        reviews[_index] = lastReview;

        // Reduce the length of the array by one
        reviews.pop();

        // Emit the ReviewDeleted event
        bytes32 reviewHash = reviewToDelete.reviewHash;
        emit ReviewDeleted(
            msg.sender,
            reviewToDelete.companyName,
            reviewToDelete.jobTitle,
            reviewHash
        );
    }

    function addAuthorizedLister(address _lister) public onlyOwner {
        authorizedListers[_lister] = true;
    }

    function removeAuthorizedLister(address _lister) public onlyOwner {
        delete authorizedListers[_lister];
    }

    function isAuthorizedLister(address _lister) public view returns (bool) {
        return authorizedListers[_lister];
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }

    function deleteReviewsByReviewer(address _reviewer) public {
        for (uint256 i = 0; i < reviews.length; i++) {
            if (reviews[i].reviewer == _reviewer) {
                delete reviews[i];
                emit ReviewDeleted(
                    _reviewer,
                    reviews[i].companyName,
                    reviews[i].jobTitle,
                    reviews[i].reviewHash
                );
            }
        }
    }

    function setReviewText(uint256 reviewId, string memory reviewText) public {
        require(reviewId < reviews.length, "Review ID does not exist");
        Review storage review = reviews[reviewId];
        review.id = reviewId;
        review.reviewText = reviewText;
    }

    function getBytes32Length(bytes32 data) public pure returns (uint256) {
        bytes memory bytesData = new bytes(32);
        assembly {
            mstore(add(bytesData, 32), data)
        }
        return bytesData.length;
    }
}
