import {Component, ChangeDetectorRef} from '@angular/core';
import axios from 'axios';
import { extractFromXml } from '@extractus/feed-extractor'
import {metaMaskModule} from './app.metamask';
import * as ethers from 'ethers';

/**
 * Contract ABI
 */
import paywallJson from '../assets/Paywall.json';

/**
 * Class Constants
 */
const ALCHEMY_APIKEY = "LCL0lLCmMpejH_FbIzsjwkBBFRqHbPLv"
const PAYWALL_CONTRACT_ADDRESS = "0x78B7638fC5d5e5888c977F8EA5AfdB7D99892d37";
const BACKEND_API_ENDPOINT = "http://localhost:4000/";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  metaMask: metaMaskModule;
  defaultProvider: ethers.Provider;
  currentSigner: ethers.Signer | undefined;
  paywallContractAddress: string;
  paywallContract: ethers.Contract | undefined;
  appStatus: any;
  rssFeedObject: any
  currentArticle: any
  isLifetimeSubscriber: boolean = false;

  /**
   * App Component Constructor
   * @param cdr
   */
  constructor(private cdr: ChangeDetectorRef) {
    // Define our MetaMask Wallet Provider with angular view updater as callback
    this.metaMask = new metaMaskModule(() => this.refreshUI());

    // Setup a Metamask Web3 provider
    this.defaultProvider = ethers.getDefaultProvider('https://eth-sepolia.g.alchemy.com/v2/LCL0lLCmMpejH_FbIzsjwkBBFRqHbPLv');//this.metaMask.web3provider;

    // Set Contract Addresses
    this.paywallContractAddress = PAYWALL_CONTRACT_ADDRESS || '';

    // Object to store App status view vars
    this.appStatus = {
      owner: '',
      state: 1,
      loading: 0
    }
  }

  /**
   * Check Network status and init App
   */
  async checkStatus() {
    if (!this.metaMask.isConnectedToSepolia()) {
      alert('Not connected to Sepolia');
      return;
    }
    // Init Contracts
    await this.initContracts();

    // Setup Current Signer
    this.currentSigner = await this.metaMask.getSigner();

    if(this.paywallContract) {

      // Get RSS feed
      await this.getNewsFeed().then( (r:any) => {
        this.rssFeedObject = r.data;
        //console.log( this.rssFeedObject );
      });

    }
  }

  /**
   * Init Contracts
   */
  async initContracts(){
    if(!this.paywallContract) {
      console.log('Setup Contracts');
      // Set Token Contract Object
      this.paywallContract = new ethers.Contract(
        this.paywallContractAddress,
        paywallJson.abi,
        this.defaultProvider
      );
    }
    if(this.currentSigner){
      // Check if lifetime subscriber
      //this.paywallContract.connect( this.currentSigner );
      this.isLifetimeSubscriber = await this.paywallContract['hasLifetimeSubscription'](
        this.metaMask.userWalletAddress
      );
    }
  }


  /**
   * Purchase Lifetime subscription to contract
   */
  async purchaseSubscription() {
    if(this.paywallContract && this.currentSigner) {
      try {
        // Connect current wallet signer
        this.paywallContract.connect(this.currentSigner);
        // Execute subscription transaction
        const tx = await this.paywallContract['buyLifetimeSubscription']({
          value: ethers.parseEther("0.1"),
          gasLimit: 200000
        });
        const rcpt = await tx.wait();
        console.log(tx);
        console.log(rcpt);
        this.currentArticle.accessible = true;
      }catch (e) {
        this.currentArticle.accessible = false;
        console.log(e);
      }
    }
  }

  /**
   * Purchase Single Article Access
   */
  async purchaseArticle() {
    if(this.paywallContract && this.currentSigner) {
      try {
        // Connect current wallet signer
        this.paywallContract.connect(this.currentSigner);
        // Execute subscription transaction
        const tx = await this.paywallContract['buyArticle']({
          value: ethers.parseEther("0.00001"),
          gasLimit: 200000
        });
        const rcpt = await tx.wait();
        console.log(tx);
        console.log(rcpt);

        this.currentArticle.accessible = true;
      }catch (e) {
        console.log(e);
      }
    }
  }

  /**
   * Set Current Article from click event
   * Determine if accessible or not
   * @param index
   * @param item
   */
  loadArticle(index:number, item:any){
    this.currentArticle = item;
    this.currentArticle.index = index;
    this.currentArticle.accessible = this.isLifetimeSubscriber;

    // TODO if not a subscriber, read contract to find out if in paid articles list
  }

  /**
   * Open popup to full article
   */
  readArticle(){
    window.open(this.currentArticle.url, 'articleWindow', "toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=100,width=800,height=600");
  }

  /**
   * Get List of Users current paid for articles
   * @returns {Promise<void>}
   */
  async getUserArticles() {
    if(this.paywallContract) {
      console.log(`Get User Articles for ${this.metaMask.userWalletAddress}`);
      const articles = await this.paywallContract['getUserArticles'](this.metaMask.userWalletAddress);
      console.log(articles);
    }
  }

  /**
   * Get Article url/content from backend.
   * Not used currently
   */
  async getNewsArticle(url:string) {
    return new Promise((resolve, reject) => {
      axios({
        url: this.getAPIEndpoint('news-article'),
        method: 'POST',
        data: {
          url: url,
          address: this.metaMask.userWalletAddress,
          signature: ''
        }
      })
      .then((r:any) => {
        resolve(r);
      }).catch((e:any) => reject(e));
    });
  }

  /**
   * Get RSS feed of news articles
   * @param url
   */
  async getNewsFeed() {
    return new Promise((resolve, reject) => {
      axios({
        url: this.getAPIEndpoint('news-feed'),
        method: 'GET',
      })
      .then((r:any) => {
        resolve(r);
      }).catch((e:any) => reject(e));
    });
  }

  /**
   * Concat uri with API end
   * point url
   * @param uri
   */
  getAPIEndpoint(uri:string) {
    return BACKEND_API_ENDPOINT + uri;
  }


  /**
   * Callback function to refresh angular UI after external updates.
   */
  async refreshUI(){
    if(this.appStatus.state !== 0){
      await this.checkStatus();
    }
    this.cdr.detectChanges();
  }

  /**
   * Display Error - todo add Toast/Alert
   */
  displayError(e:any){
    this.appStatus.loading = 0;
    alert(e);
  }
}
