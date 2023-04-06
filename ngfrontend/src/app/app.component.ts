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
  defaultProvider: ethers.providers.Provider;
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
    this.defaultProvider = this.metaMask.web3provider; //ethers.getDefaultProvider('https://eth-sepolia.g.alchemy.com/v2/LCL0lLCmMpejH_FbIzsjwkBBFRqHbPLv');

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
      //await this.getNewsFeed().then( (r:any) => {
      //  this.rssFeedObject = r.data;
        //console.log( this.rssFeedObject );
      //});

      // Temp hack for demo
      this.rssFeedObject = JSON.parse( this.getArticlesJson() );

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
      const connectedContract = await this.paywallContract.connect( this.currentSigner );
      this.isLifetimeSubscriber = await connectedContract['hasLifetimeSubscription'](
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
        const connectedContract = await this.paywallContract.connect( this.currentSigner );
        // Execute subscription transaction
        const tx = await connectedContract['buyLifetimeSubscription']({
          value: ethers.utils.parseEther("0.5"),
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
        const connectedContract = await this.paywallContract.connect( this.currentSigner );
        // Execute subscription transaction
        const tx = await connectedContract['buyArticle'](this.currentArticle.index, {
          value: ethers.utils.parseEther("0.00001"),
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
   * Temp hack to add articles index to contract so purchasable
   * @param index
   */
  async addArticleToContract(url:string){
    if(this.paywallContract && this.currentSigner) {
      try {
        // Connect current wallet signer
        const connectedContract = await this.paywallContract.connect(this.currentSigner);
        // Execute subscription transaction
        const tx = await connectedContract['addNewArticle'](ethers.utils.parseEther("0.00001"), url, {
          gasLimit: 200000
        });
        const rcpt = await tx.wait();
        console.log(tx);
        console.log(rcpt);
      } catch (e) {
        console.log(e);
      }
    }
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

  /**
   * Static list of articles for demo
   */
  getArticlesJson(): any {
    return JSON.stringify([
      {
        title: 'FTX philanthropic donations have created a complex dilemma for recipients',
        url: 'https://cointelegraph.com/news/ftx-philanthropic-donations-have-created-a-complex-dilemma-for-recipients',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvMGNlMjNkYTAtNGU5Yi00YjE2LWJmYTEtNTQ4OGY4YjRlNDVkLmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 12:07:48 +0100',
        description: 'University-affiliated research initiatives received more than $13 million in grants from FTX Future Fund, with several students getting $100,000 in grants. ',
      },
      {
        title: 'Nigerian crypto foreign investment is at a record low: Study',
        url: 'https://cointelegraph.com/news/nigerian-crypto-foreign-investment-is-at-a-record-low-study',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvMWM1MzgzODYtOGZhZS00MzRlLTk5NTYtMWNlZTk3MDZlNDllLmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 10:20:00 +0100',
        description: 'Foreign direct investment in Nigeria fell by 33% last year due to a severe shortage of dollars, which discouraged crypto companies from expanding into the country.',
      },
      {
        title: 'Bitcoin barely holds $28K as bulls see new rejection at key resistance',
        url: 'https://cointelegraph.com/news/bitcoin-barely-holds-28k-as-bulls-see-new-rejection-at-key-resistance',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvODg2NmY5ODItYTIyZi00MjgwLThiNzYtOTEwNWEyNDI5MjE4LmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 10:15:55 +0100',
        description: 'A fresh BTC price charge on liquidity around $30,000 ends in a return to a familiar Bitcoin trading range.',
      },
      {
        title: 'Reddit deploys Gen 3 NFT avatar contracts on Polygon',
        url: 'https://cointelegraph.com/news/reddit-deploys-gen-3-nft-avatar-contracts-on-polygon',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvMzk2ZTdmM2UtNjk2NC00NWE2LThiZDktMTkxMTYzMWY0OTgxLkpQRw==.jpg',
        date: 'Thu, 06 Apr 2023 09:50:00 +0100',
        description: 'Community members responded to the new development, with some praising Reddit’s marketing efforts and changing the anti-NFT narrative within the platform.',
      },
      {
        title: 'Crypto trading vs. crypto investing: Key differences explained',
        url: 'https://cointelegraph.com/explained/crypto-trading-vs-crypto-investing-key-differences-explained',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS9zdG9yYWdlL3VwbG9hZHMvdmlldy84ODQ2MzZkMmViZmVkNDdiNzI3MzI1ZDhlMzZjMWE5My5qcGc=.jpg',
        date: 'Thu, 06 Apr 2023 09:46:00 +0100',
        description: 'Crypto trading and investing are often intertwined, but key differences remain between the two methods.',
      },
      {
        title: 'Binance Australia Derivatives license canceled by securities regulator',
        url: 'https://cointelegraph.com/news/binance-australia-derivatives-license-canceled-by-securities-regulator',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvNDg0ZTdhNDktMzA0ZC00MGUyLWE2ZDgtYWU5ZWIwOWU2NjliLmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 09:34:28 +0100',
        description: 'In February, Binance Australia Derivatives abruptly closed certain derivatives positions and accounts, citing investor classification compliance.',
      },
      {
        title: 'Singapore to introduce uniform screening standards for crypto bank accounts',
        url: 'https://cointelegraph.com/news/singapore-to-introduce-uniform-screening-standards-for-crypto-bank-accounts',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvNTg3MDExYzUtMzY4ZS00MDliLWFiZDktZWE5YTg5YTVjN2JhLmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 08:51:08 +0100',
        description: 'Potential guidelines reportedly won’t have a binding force over banks, which can rely on their own risk assessment.',
      },
      {
        title: 'Jane Street, Tower Research and Radix are Binance’s ‘VIP’ clients in CFTC suit: Report',
        url: 'https://cointelegraph.com/news/jane-street-tower-research-and-radix-are-binance-s-vip-clients-in-cftc-suit-report',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvOGU2M2U1MDQtYTQyMS00ZjllLTlkY2YtNDE3ZWJiMDAxY2RjLmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 07:47:35 +0100',
        description: 'The firms were cited anonymously in the CFTC’s complaint describing Binance’s alleged facilitation of U.S. clients.',
      },
      {
        title: 'Bear markets are for filming: The Bitcoin Film Festival in Warsaw',
        url: 'https://cointelegraph.com/news/bear-markets-are-for-filming-the-bitcoin-film-festival-in-warsaw',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvNDNhMjY3YjQtOTUxNy00NzZhLTg0YWUtNmI1ODQ3MTkzODhiLmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 07:39:12 +0100',
        description: 'Lights, camera, Bitcoin: A Bitcoin Film Festival in Poland brought the Bitcoin revolution to the big screen. ',
      },
      {
        title: 'Names of non-US FTX users demanded by mainstream media outlets',
        url: 'https://cointelegraph.com/news/names-of-non-us-ftx-users-demanded-by-mainstream-media-outlets',
        image: 'https://images.cointelegraph.com/images/840_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDQvOTQxZTU5ZjYtMjU0NS00NjQ3LWEyNjQtZTU1MDVkZWJhNzU4LmpwZw==.jpg',
        date: 'Thu, 06 Apr 2023 06:55:26 +0100',
        description: 'A number of mainstream media outlets are pushing to publicize the personal details of FTX’s non-United States customers, similar to what happened with Celsius.',
      },
    ]);
  }
}
