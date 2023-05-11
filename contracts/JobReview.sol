pragma solidity ^0.8.10;

import "./JOBcoin.sol";

contract JobReview {
    uint counterReviews;
    uint counterListings;

    JOBcoin private _jobCoin;

    struct Review {
        uint id;
        uint jobId;
        address reviewer;
        string companyName;
        string jobTitle;
        bytes32 reviewHash;
        string reviewText;
        uint salary;
        uint8 rating;
    }

    struct JobListing {
        uint id;
        string companyName;
        string jobTitle;
        string description;
        address poster;
    }

    Review[] public reviews;
    JobListing[] public jobListings;

    mapping(address => bool) public authorizedListers;

    address public owner;

    event JobListingCreated(
        string companyName,
        string jobTitle,
        string description,
        address poster
    );
    event ReviewSubmitted(
        uint reviewId,
        address indexed reviewer,
        string companyName,
        string jobTitle,
        bytes32 reviewHash,
        string reviewText,
        uint salary,
        uint8 rating
    );

    event ReviewUpdated(
        uint reviewId,
        address indexed reviewer,
        string companyName,
        string jobTitle,
        bytes32 reviewHash,
        string reviewText,
        uint salary,
        uint8 rating
    );

    event ReviewDeleted(
        uint reviewId,
        address indexed reviewer,
        string companyName,
        string jobTitle,
        bytes32 reviewHash,
        uint salary,
        uint8 rating
    );

    event LogMessage(string message);

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner can call this function"
        );
        _;
    }

    modifier onlyAuthorizedLister() {
        require(
            authorizedListers[msg.sender] || msg.sender == owner,
            "Only authorized listers can call this function"
        );
        _;
    }

    modifier onlyJobListingPoster(uint _id) {
        require(_id < jobListings.length, "JobListing does not exist");
        require(
            jobListings[_id].poster == msg.sender,
            "Only job listing poster can call this function"
        );
        _;
    }

    constructor(address jobCoinAddress) {
        _jobCoin = JOBcoin(jobCoinAddress);
        owner = msg.sender;
        resetCounters();
    }

    function resetCounters() public {
        counterReviews = 0;
        counterListings = 0;
    }

    function createJobListing(
        string memory _companyName,
        string memory _jobTitle,
        string memory _desc
    ) public onlyAuthorizedLister {
        require(
            _jobCoin.balanceOf(msg.sender) >= 0.5 ether,
            "Insufficient JOBcoins"
        );

        // Deduct 0.5 JOBcoins from the sender's balance
        _jobCoin.transferFrom(msg.sender, owner, 0.5 ether);

        JobListing memory newJob = JobListing(
            counterListings++,
            _companyName,
            _jobTitle,
            _desc,
            msg.sender
        );
        jobListings.push(newJob);
        emit JobListingCreated(_companyName, _jobTitle, _desc, msg.sender);
    }

    function getJobListingsCount() public view returns (uint256) {
        return jobListings.length;
    }

    function getJobListing(
        uint256 _index
    ) public view returns (string memory, string memory, string memory) {
        require(_index < jobListings.length, "Index out of range");
        JobListing memory job = jobListings[_index];
        return (job.companyName, job.jobTitle, job.description);
    }

    function updateJobListing(
        uint _id,
        string memory _companyName,
        string memory _jobTitle,
        string memory _desc
    ) public {
        require(_id < jobListings.length, "JobListing does not exist");
        require(
            bytes(_companyName).length > 0,
            "Company name must not be empty"
        );
        require(bytes(_jobTitle).length > 0, "Job title must not be empty");

        jobListings[_id].companyName = _companyName;
        jobListings[_id].jobTitle = _jobTitle;
        jobListings[_id].description = _desc;
    }

    function deleteJobListing(uint _id) public onlyJobListingPoster(_id) {
        require(_id < jobListings.length);

        require(
            _jobCoin.balanceOf(msg.sender) >= 0.5 ether,
            "Insufficient JOBcoins"
        );

        // Deduct 0.5 JOBcoins from the sender's balance
        _jobCoin.transferFrom(msg.sender, owner, 0.5 ether);

        for (uint i = reviews.length; i > 0; i--) {
            if (reviews[i - 1].jobId == _id) {
                deleteReview(i - 1);
            }
        }

        jobListings[_id] = jobListings[jobListings.length - 1];

        jobListings.pop();
    }

    function submitReview(
        string memory _companyName,
        string memory _jobTitle,
        bytes32 _reviewHash,
        string memory _reviewText,
        uint _salary,
        uint8 _rating
    ) public {
        require(
            bytes(_companyName).length > 0,
            "Company name must not be empty"
        );
        require(bytes(_jobTitle).length > 0, "Job title must not be empty");

        require(_reviewHash != bytes32(0), "Hash must not be empty");
        require(_rating >= 1 && _rating <= 5, "Invalid rating");
        uint myid = counterReviews++;
        Review memory newReview = Review(
            myid,
            999999999,
            msg.sender,
            _companyName,
            _jobTitle,
            _reviewHash,
            _reviewText,
            _salary,
            _rating
        );
        reviews.push(newReview);
        emit ReviewSubmitted(
            myid,
            msg.sender,
            _companyName,
            _jobTitle,
            _reviewHash,
            _reviewText,
            _salary,
            _rating
        );
    }

    function createReview(
        uint _jobId,
        bytes32 _reviewHash,
        string memory _reviewText,
        uint _salary,
        uint8 _rating
    ) public {
        require(_jobId < jobListings.length, "JobListing does not exist");

        JobListing memory job = jobListings[_jobId];
        uint myid = counterReviews++;
        Review memory newReview = Review({
            id: myid,
            jobId: _jobId,
            reviewer: msg.sender,
            companyName: job.companyName,
            jobTitle: job.jobTitle,
            reviewHash: _reviewHash,
            reviewText: _reviewText,
            rating: _rating,
            salary: _salary
        });

        reviews.push(newReview);

        emit ReviewSubmitted(
            myid,
            msg.sender,
            jobListings[_jobId].companyName,
            jobListings[_jobId].jobTitle,
            _reviewHash,
            _reviewText,
            _salary,
            _rating
        );
    }

    function getReview(
        uint256 _index
    )
        public
        view
        returns (address, string memory, string memory, bytes32, uint, uint8)
    {
        require(_index < reviews.length, "Index out of range");
        Review memory review = reviews[_index];
        return (
            review.reviewer,
            review.companyName,
            review.jobTitle,
            review.reviewHash,
            review.salary,
            review.rating
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

    function getReviewsCount() public view returns (uint256) {
        return reviews.length;
    }

    function setReviewText(uint256 reviewId, string memory reviewText) public {
        require(reviewId < reviews.length, "Review ID does not exist");
        Review storage review = reviews[reviewId];
        review.id = reviewId;
        review.reviewText = reviewText;
    }

    function updateReview(
        uint _reviewId,
        bytes32 _reviewHash,
        string memory _reviewText,
        uint _salary,
        uint8 _rating
    ) public {
        require(_reviewId < reviews.length, "Invalid review ID");

        Review storage reviewToUpdate = reviews[_reviewId];

        require(
            msg.sender == reviewToUpdate.reviewer,
            "Only reviewer can update review"
        );
        require(_reviewHash != bytes32(0), "Hash must not be empty");
        require(_rating >= 1 && _rating <= 5, "Invalid rating");

        reviewToUpdate.reviewHash = _reviewHash;
        reviewToUpdate.reviewText = _reviewText;
        reviewToUpdate.salary = _salary;
        reviewToUpdate.rating = _rating;

        emit ReviewUpdated(
            reviewToUpdate.id,
            reviewToUpdate.reviewer,
            reviewToUpdate.companyName,
            reviewToUpdate.jobTitle,
            reviewToUpdate.reviewHash,
            reviewToUpdate.reviewText,
            reviewToUpdate.salary,
            reviewToUpdate.rating
        );
    }

    function deleteReview(uint256 _index) public {
        require(_index < reviews.length, "Index out of range");
        Review memory reviewToDelete = reviews[_index];

        Review memory lastReview = reviews[reviews.length - 1];
        reviews[_index] = lastReview;

        reviews.pop();
        counterReviews--;

        bytes32 reviewHash = reviewToDelete.reviewHash;
        emit ReviewDeleted(
            reviewToDelete.id,
            msg.sender,
            reviewToDelete.companyName,
            reviewToDelete.jobTitle,
            reviewHash,
            reviewToDelete.salary,
            reviewToDelete.rating
        );
    }

    function deleteReviewsByReviewer(address _reviewer) public {
        for (uint256 i = 0; i < reviews.length; i++) {
            if (reviews[i].reviewer == _reviewer) {
                delete reviews[i];
                emit ReviewDeleted(
                    reviews[i].id,
                    _reviewer,
                    reviews[i].companyName,
                    reviews[i].jobTitle,
                    reviews[i].reviewHash,
                    reviews[i].salary,
                    reviews[i].rating
                );
            }
        }
    }

    function addAuthorizedLister(address _lister) public onlyOwner {
        authorizedListers[_lister] = true;
    }

    function removeAuthorizedLister(address _lister) public onlyOwner {
        delete authorizedListers[_lister];
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }

    function isAuthorizedLister(address _lister) public view returns (bool) {
        return authorizedListers[_lister];
    }

    function getBytes32Length(bytes32 data) internal pure returns (uint256) {
        bytes memory bytesData = new bytes(32);
        assembly {
            mstore(add(bytesData, 32), data)
        }
        return bytesData.length;
    }

    function getAllReviewsOfJobListing(
        uint _jobId
    ) public view returns (Review[] memory) {
        Review[] memory jobReviews;
        uint jobReviewsCounter = 0;
        for (uint i = 0; i < reviews.length; i++) {
            if (reviews[i].jobId == _jobId) {
                jobReviewsCounter++;
            }
        }
        jobReviews = new Review[](jobReviewsCounter);
        jobReviewsCounter = 0;
        for (uint i = 0; i < reviews.length; i++) {
            if (reviews[i].jobId == _jobId) {
                jobReviews[jobReviewsCounter] = reviews[i];
                jobReviewsCounter++;
            }
        }
        return jobReviews;
    }

    function _getSalaryStats(
        string memory _jobTitle,
        string memory _companyName
    ) internal view returns (uint, uint, uint) {
        uint totalSalary = 0;
        uint minSalary = 99999999999;
        uint maxSalary = 0;
        uint numReviews = 0;
        for (uint i = 0; i < reviews.length; i++) {
            if (
                (keccak256(bytes(reviews[i].jobTitle)) ==
                    keccak256(bytes(_jobTitle)) &&
                    keccak256(bytes(reviews[i].companyName)) ==
                    keccak256(bytes(_companyName))) ||
                (bytes(_jobTitle).length == 0 &&
                    keccak256(bytes(reviews[i].companyName)) ==
                    keccak256(bytes(_companyName))) ||
                (
                    (keccak256(bytes(reviews[i].jobTitle)) ==
                        keccak256(bytes(_jobTitle)) &&
                        bytes(_companyName).length == 0)
                )
            ) {
                totalSalary += reviews[i].salary;
                minSalary = (reviews[i].salary < minSalary)
                    ? reviews[i].salary
                    : minSalary;
                maxSalary = (reviews[i].salary > maxSalary)
                    ? reviews[i].salary
                    : maxSalary;
                numReviews++;
            }
        }
        require(numReviews > 0, "No reviews found");
        uint avgSalary = totalSalary / numReviews;
        return (avgSalary, minSalary, maxSalary);
    }

    function getAllReviewsByReviewer(
        address _reviewer
    ) public view returns (Review[] memory) {
        Review[] memory reviewerReviews;
        uint reviewerReviewsCounter = 0;
        for (uint i = 0; i < reviews.length; i++) {
            if (reviews[i].reviewer == _reviewer) {
                reviewerReviewsCounter++;
            }
        }
        reviewerReviews = new Review[](reviewerReviewsCounter);
        reviewerReviewsCounter = 0;
        for (uint i = 0; i < reviews.length; i++) {
            if (reviews[i].reviewer == _reviewer) {
                reviewerReviews[reviewerReviewsCounter] = reviews[i];
                reviewerReviewsCounter++;
            }
        }
        return reviewerReviews;
    }

    function getCompanySalaryStats(
        string memory _companyName
    ) public view returns (uint, uint, uint) {
        return _getSalaryStats("", _companyName);
    }

    function getJobTitleSalaryStats(
        string memory _jobTitle
    ) public view returns (uint, uint, uint) {
        return _getSalaryStats(_jobTitle, "");
    }

    function getJobTitleSalaryStatsAtCompany(
        string memory _jobTitle,
        string memory _companyName
    ) public view returns (uint, uint, uint) {
        return _getSalaryStats(_jobTitle, _companyName);
    }
}
