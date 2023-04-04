import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import {ethers, sha256} from 'ethers';
import * as helpers from "./helpers";
import * as payWallJson from './assets/PayWall.json';


const PAYWALL_CONTRACT_ADDRESS = '';
const RSS_NEWS_FEED = 'https://cointelegraph.com/rss';

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
    //this.provider = helpers.getTestnetProvider(1);

    // Define Token Contact
    //this.payWallContract = new ethers.Contract(
    //    PAYWALL_CONTRACT_ADDRESS,
    //    payWallJson.abi,
    //    this.provider
    //);
  }

  /**
   * Get Paywall Contract Address
   */
  getPaywallContractAddress(): string {
    return PAYWALL_CONTRACT_ADDRESS;
  }

  /**
   * Get Is Address Subscribed
   * @param address
   */
  getHasWalletAddressSubscribed(address: string): boolean {
    // TODO check contract for subscriber

    return true
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
