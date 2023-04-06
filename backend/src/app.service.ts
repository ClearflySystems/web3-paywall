import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import {ethers, sha256} from 'ethers';
import * as helpers from "./helpers";
import * as payWallJson from './assets/Paywall.json';
import * as dotenv from 'dotenv';
import * as process from "process";
dotenv.config();

const PAYWALL_CONTRACT_ADDRESS = process.env.SEPOLIA_CONTRACT_ADDRESS
const RSS_NEWS_FEED = 'https://cointelegraph.com/feed'; //https://cryptopotato.com/feed
const ARTICLE_PRICE = "0.01";

@Injectable()
export class AppService {
  provider: ethers.Provider;
  signer: ethers.Wallet;
  payWallContract: ethers.Contract;

  /**
   * Init Class Vars
   */
  constructor(private readonly httpService: HttpService) {
    // Define Alchemy provider
    this.provider = helpers.getTestnetProvider(1);

    // Check Private Key for Contract Deployer Is present
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY', 'Missing or Invalid Private Key.');

    // Connect Signer Wallet so we can Admin Contract
    this.signer = helpers.getConnectedSignerWallet(privateKey, this.provider);

    // Define Token Contact
    this.payWallContract = new ethers.Contract(
        PAYWALL_CONTRACT_ADDRESS,
        payWallJson.abi,
        this.provider
    );
  }

  /**
   * Get Paywall Contract Address
   */
  getPaywallContractAddress(): string {
    return PAYWALL_CONTRACT_ADDRESS;
  }

  /**
   * Get All Contract Articles
   * We will iterate outside of the contract
   */
  async getAllArticles(): Promise<any> {
    try{
      return await this.payWallContract.articles();
    }catch(e){
      console.log(e);
    }
  }

  /**
   * Add New Article to Smart Contracts list of Articles.
   */
  async addArticle(url): Promise<boolean> {
    try{
      return await this.payWallContract.addNewArticle(
          ethers.parseEther(ARTICLE_PRICE),
          url
      );
    }catch(e){
      console.log(e);
    }
  }

  /**
   * Get Is Address Subscribed
   * @param address
   */
  async getHasWalletAddressSubscribed(address: string): Promise<boolean> {
    return await this.payWallContract.hasLifetimeSubscription(address);
  }

  /**
   * Has Wallet Address Paid for Article (hash of url)
   * @param address
   * @param url
   */
  getHasWalletAddressPaidArticle(address: string, url: string): boolean {
    // TODO check contract for article payment
    //const hash = this.createHash(url);
    return true
  }

  /**
   * HTTP Call to Get RSS Feed proxy call.

  async getRssFeed(): Promise<string> {
    const { data } = await firstValueFrom(
      this.httpService.get(RSS_NEWS_FEED).pipe(
        catchError((error: AxiosError) => {
          console.error(error.response.data);
          throw 'An error happened!';
        }),
      )
    );
    return data;
  }*/

  /**
   * Get Full Article from url
   * @param url
   */
  async getArticle(url): Promise<string> {
    const { data } = await firstValueFrom(
        this.httpService.get(url).pipe(
            catchError((error: AxiosError) => {
              console.error(error.response.data);
              throw 'An error happened!';
            }),
        )
    );
    return data;
  }

  /**
   * Create SHA256 Hash of a string
   * @param input
   */
  createHash(input): string {
    return sha256( ethers.encodeBytes32String(input) );
  }

  /**
   * Check if articles list added to contract
   */
  async deployNewsArticles(): Promise<string>{
    //const articles = this.getAllArticles();
    //console.log(articles);

    const articles = JSON.parse( this.getArticlesJson() );
    for(let i=0; i<articles.length; i++){
      let article = articles[i];
      console.log(article);

      await this.addArticle(article.url);

      break;
    }
    //await this.addArticle(article.url);

    return JSON.stringify( articles );
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
