import axios from "axios";
import { Network, Alchemy, Contract, Utils } from "alchemy-sdk";
import * as paywallJson from "../assets/Paywall.json";

const ALCHEMY_APIKEY = 'LCL0lLCmMpejH_FbIzsjwkBBFRqHbPLv';
const PAYWALL_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const PAYWALL_CONTRACT_NETWORK = 'localhost';
const BACKEND_API_ENDPOINT = 'http://localhost:4000/'


const alchemy = new Alchemy({
    apiKey: ALCHEMY_APIKEY,
    network: Network.ETH_SEPOLIA
});

let payWallContract;
let wagmiClient;
let currentAddress;

/**
 *  Export API service interface
 */
export const init = async (_wagmiClient, _account) => {
    console.log(`INIT Paywall Connect ${_account.address}`);

    wagmiClient = _wagmiClient;

    // Setup Default Provider
    //const defaultProvider = await alchemy.config.getProvider();

    // Setup Contract Connector
    payWallContract = new Contract(
        PAYWALL_CONTRACT_ADDRESS,
        paywallJson.abi,
        wagmiClient.provider
    );
    currentAddress = _account.address;
    // Setup Current Wallet Signer
    //defaultSigner = wagmiClient.provider.getSigner();

}

/**
 * Purchase Lifetime subscription to contract
 */
export const purchaseSubscription = async () => {
    console.log( wagmiClient.provider.getSigner() );

    console.log( window.ethereum );

    const signer = wagmiClient.provider.getSigner();

    const tx = await payWallContract.connect(signer).buyLifetimeSubscription({
        value: Utils.parseEther("0.1"),
        gasLimit: 200000
    });
    const rcpt = await tx.wait();

    console.log(tx);
    console.log(rcpt);
}

/**
 * Get List of Users current paid for articles
 * @returns {Promise<void>}
 */
export const getUserArticles = async () => {
    console.log( `Get User Articles for ${currentAddress}` );
    const articles = await payWallContract.getUserArticles(currentAddress);
    console.log( articles );
}

/**
 * Get Article
 */
export const getNewsArticle = async (url) => {
    return new Promise((resolve, reject) => {
        axios({
            url: getAPIEndpoint('news-article'),
            method: 'POST',
            data: {
                url: url,
                address: currentAddress,
                signature: ''
            }
        })
        .then(response => {
            resolve(response);
        }).catch((e) => reject(e));
    });
    console.log(url);
}

export const getAPIEndpoint = (uri) => {
    return BACKEND_API_ENDPOINT + uri;
}

export default init;