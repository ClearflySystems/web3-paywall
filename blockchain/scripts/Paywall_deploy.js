const hre = require("hardhat");

async function main() {
	const Contract = await hre.ethers.getContractFactory("Paywall");

	const subscriptionPrice = hre.ethers.parseEther("0.5");
	const contract = await Contract.deploy(subscriptionPrice);

	await contract.deployed();

	console.log("Paywall deployed to:", contract.address);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});