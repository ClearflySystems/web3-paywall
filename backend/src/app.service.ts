import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import {ethers, sha256} from 'ethers';
import * as helpers from "./helpers";
import * as payWallJson from './assets/Paywall.json';
import * as dotenv from 'dotenv';
dotenv.config();

const PAYWALL_CONTRACT_ADDRESS = '';
const RSS_NEWS_FEED = 'https://cointelegraph.com/rss';
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
  async getAllArticles(): Promise<[]> {
    return await this.payWallContract.articles();
  }

  /**
   * Add New Article to Smart Contracts list of Articles.
   */
  async addArticle(url): Promise<boolean> {
    return await this.payWallContract.addNewArticle(
        ethers.parseEther(ARTICLE_PRICE),
        url
    );
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
    const hash = this.createHash(url);
    return true
  }

  /**
   * HTTP Call to Get RSS Feed proxy call.
   */
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
  }

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

}
