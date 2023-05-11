const Jobcoin = artifacts.require("JOBcoin");
const JobReview = artifacts.require("JobReview");

module.exports = async function (deployer, network, accounts) {
  const transferAmountInEther = 10000000;
  const amountInWei = web3.utils.toWei(transferAmountInEther.toString(), "ether");

  await deployer.deploy(Jobcoin, "JOBcoin", "JOB", amountInWei);
  const tokenInstance = await Jobcoin.deployed();

  // Transfer JOBcoins to test users
  const initialBalance = web3.utils.toWei("10", "ether"); // Set initial balance to 10 JOBcoins
  const testUser1 = accounts[1];
  const testUser2 = accounts[2];

  const printthis = await tokenInstance.balanceOf(accounts[0]);

  await tokenInstance.approve(testUser1, initialBalance, { from: accounts[0] });
  await tokenInstance.approve(testUser2, initialBalance, { from: accounts[0] });
  
  await tokenInstance.transfer(testUser1, initialBalance, { from: accounts[0] });
  await tokenInstance.transfer(testUser2, initialBalance, { from: accounts[0] });

  await deployer.deploy(JobReview, tokenInstance.address);
};
