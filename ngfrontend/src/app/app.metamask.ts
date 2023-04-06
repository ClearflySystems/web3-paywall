import detectEthereumProvider from '@metamask/detect-provider';
import { MetaMaskInpageProvider } from '@metamask/providers';
import * as ethers from "ethers";

declare global {
  interface Window {
    ethereum: any
  }
}

interface IchainIds {
  [index: number]: string;
}
const chainIds: IchainIds = {
  1337: 'Localhost',
  0: 'No Network',
  1: 'Ethereum Main Network',
  3: 'Ropsten Test Network',
  4: 'Rinkeby Test Network',
  5: 'Goerli Test Network',
  42: 'Kovan Test Network',
  11155111: 'Sepolia Test Network',
}

/// @title A simple MetaMask Connector
/// @author Simon Thomas
export class metaMaskModule {
  provider: MetaMaskInpageProvider | null | undefined;
  web3provider: ethers.BrowserProvider;
  userWalletAddress: string = '';
  userWalletNetwork: number = 0;
  userEthBalance: number = 0;
  onUpdateCallback: Function;

  /**
   * Module Constructor - takes callback whenever wallet vars change
   * @param onUpdateCallback
   */
  constructor( onUpdateCallback:Function ) {
    this.web3provider = new ethers.BrowserProvider(window.ethereum);
    this.initMetaMaskProvider().catch(e => {
      console.log('Error initialising MetaMask Wallet Connection');
    });
    this.onUpdateCallback = onUpdateCallback;
  }

  /**
   * Setup MetaMask Provider with callbacks then connect.
   * Using New MetaMask In Page detection
   */
  async initMetaMaskProvider() {
    this.provider = await detectEthereumProvider();
    if(this.provider) {
      // Set Account switch callback
      this.provider.on('accountsChanged', async (accounts: any) => {
        //console.log(`Metamask account switched: ${accounts}`);
        //await this.initLocalWallet(accounts);
        document.location.reload();
      });
      // Set Network/Chain switch callback
      this.provider.on('chainChanged', async (chainId: any) => {
        console.log(`Metamask chain switched: ${chainId}`);
        // await this.initLocalWallet([this.userWalletAddress]);
        // window.ethereum is stuck on old network so force page reload.
        document.location.reload();
      });
      // Listen for disconnect, but it appears accountsChanged<empty> fires instead so maybe deprecated
      this.provider.on('disconnect', (error: any) => {
        console.log(`Metamask disconnected: ${error}`);
        this.disconnectWallet();
      });
      this.provider.on('error', (error:any) => {
        console.log(`Metamask error caught: ${error}`);
      });
      //this.web3provider.on('message', (error:any) => {
      //  console.log(`Metamask message caught: ${error}`);
      //});
      // On Message notification
      //this.provider.on('message', (message: any) => {
      //  console.log(message);
      //  alert(message);
      //  this.onUpdateCallback();
      //});
      // Connect Wallet
      this.connectWallet();
    }
  }

  /**
   * Initial Call to connect MetaMask wallet using the eth_requestAccounts call
   */
  connectWallet() {
    if(this.provider) {
      this.provider.request({method: "eth_requestAccounts"}).then(async (accounts: any) => {
        await this.initLocalWallet(accounts);
      });
    }
  }

  /**
   * Initialise userWallet variables - Address, Balance and Network
   * @param accounts - empty on disconnect
   */
  async initLocalWallet(accounts: any) {
    if(this.provider && accounts.length) {
      this.userWalletAddress = accounts[0];
      this.provider.request({
        method: "eth_getBalance",
        params: [this.userWalletAddress, 'latest']
      }).then(async (balanceBN: any) => {
        const balanceStr = ethers.formatEther(balanceBN);
        this.userEthBalance = parseFloat(balanceStr.toString());
        // Update Network Name
        this.setWalletNetwork(this.provider?.networkVersion);
      });
    }else{
      this.disconnectWallet();
    }
  }

  /**
   * Allow UI to call balance refresh after transactions.
   */
  async refreshWallet(){
    if(this.provider && this.userWalletAddress) {
      this.provider.request({
        method: "eth_getBalance",
        params: [this.userWalletAddress, 'latest']
      }).then(async (balanceBN: any) => {
        const balanceStr = ethers.formatEther(balanceBN);
        this.userEthBalance = parseFloat(balanceStr.toString());
        // Update Network Name
        this.setWalletNetwork(this.provider?.networkVersion);
      });
    }
  }

  /**
   * Match ChainId to Network Name
   * @param chainId
   */
  setWalletNetwork(chainId: any) {
    this.userWalletNetwork = parseInt(chainId);
    // view refresh callback
    this.onUpdateCallback();
  }

  /**
   * When disconnect or switched to empty account detected nuke values
   */
  disconnectWallet(){
    this.userWalletAddress = '';
    this.userWalletNetwork = 0;
    this.userEthBalance = 0;
    this.onUpdateCallback();
  }

  /**
   * Get MetaMask wallet as Signer
   */
  getSigner(){
    return this.web3provider.getSigner();
  }

  /**
   * Check current network is Goerli
   */
  isConnectedToGoerli(){
    return this.userWalletNetwork == 5;
  }

  /**
   * Check current network is Sepolia
   */
  isConnectedToSepolia(){
    return this.userWalletNetwork == 11155111;
  }

  /**
   * Getter to return Network Name
   */
  getUserWalletNetworkName(){
    return chainIds[this.userWalletNetwork] || 'Unknown Network';
  }
}
