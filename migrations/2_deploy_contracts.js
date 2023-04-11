const JobReview = artifacts.require("JobReview");

module.exports = function(deployer) {
  deployer.deploy(JobReview);
};
