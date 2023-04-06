import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv"
dotenv.config()

const config: HardhatUserConfig = {
	solidity: "0.8.18",
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {},
		// ETH_MAINNET: {
		// 	accounts: [`${process.env.PRIVATE_KEY}`],
		// 	url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
		// },
		 ETH_SEPOLIA: {
		 	accounts: [`${process.env.PRIVATE_KEY}`],
		 	url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
		 }
	}
};

export default config;