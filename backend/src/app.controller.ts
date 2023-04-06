import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import * as models from './models/modelTypes';


@Controller()
export class AppController {

  /**
   * Class Constructor
   * @param appService
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Get Paywall Contract Address
   */
  @Get("paywall-contract")
  getPaywallContractAddress(): models.ContractAddressResponse {
    const r = new models.ContractAddressResponse();
    r.address = this.appService.getPaywallContractAddress();
    return r;
  }

  /**
   * Get RSS News Feed
   */
  @Get("news-feed")
  async getNewsFeed(): Promise<string> {
    return this.appService.getArticlesJson();
  }

  /**
   * Deploy Articles To Contract
   */
  @Get("deploy-news-feed")
  async deployNewsFeed(): Promise<string> {
    return this.appService.deployNewsArticles();
  }

  /**
   * Deploy Articles To Contract
   */
  @Get("deployed-articles")
  async deployedArticles(): Promise<any> {
    return JSON.stringify( this.appService.getAllArticles() );
  }

  /**
   * Get Full Article If subscribed/paid for
   * TODO will change this to just return url if access allowed and update iframe on front end.
   *
   * @param url
   */
  @Post("news-article")
  async getNewsArticle(@Body() body: models.ArticleRequestDTO): Promise<string> {
    return body.url;
    if(
        this.appService.getHasWalletAddressSubscribed(body.address) ||
        this.appService.getHasWalletAddressPaidArticle(body.address, body.url)
    ){
      return body.url //this.appService.getArticle(body.url);
    }
    return '';
  }


}
