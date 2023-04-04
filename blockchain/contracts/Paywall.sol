// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Paywall is AccessControl {
    struct Article {
        uint256 price;
        string url;
    }

    // the price of the lifetime subscription
    uint256 public lifetimeSubscriptionPrice;

    // all users that subscribed for life
    mapping(address => bool) public lifetimeSubscribers;

    // the id of the next article
    uint256 public nextArticleId;
    mapping(uint256 => Article) public articles;

    // buyer => list of articles bought
    mapping(address => uint256[]) public buyerToArticles;

    constructor(uint256 _lifetimeSubscriptionPrice) {
        lifetimeSubscriptionPrice = _lifetimeSubscriptionPrice;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice an user can subscribe for a lifetime
    function buyLifetimeSubscription() external payable {
        require(msg.value == lifetimeSubscriptionPrice, "Wrong amount");
        require(!lifetimeSubscribers[msg.sender], "Already subscribed");
        lifetimeSubscribers[msg.sender] = true;
    }

    /// @notice allow users to buy access to an article
    function buyArticle(uint256 _articleId) external payable {
        Article memory _article = articles[_articleId];
        require(_article.price != 0, "Article does not exist");
        require(msg.value == _article.price, "Wrong amount");
        buyerToArticles[msg.sender].push(_articleId);
    }

    /// @notice add a new article
    function addNewArticle(uint256 _price, string memory _url) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // create article struct 
        Article memory article = Article({
            price: _price,
            url: _url
        });
        uint256 _articleId = ++nextArticleId;
        // save it
        articles[_articleId] = article;
    }

    /// @notice admin can change the price for lifetime sub
    function setLifetimeSubscriptionPrice(uint256 newPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lifetimeSubscriptionPrice = newPrice;
    }

    /// @notice check if a user has a lifetime subscription
    function hasLifetimeSubscription(address _user) external view returns (bool) {
        return lifetimeSubscribers[_user];
    }

    /// @notice check if a user can access a specific article
    function hasAccessToArticle(uint256 _articleId, address _user) external view returns(bool) {
        require(_articleId <= nextArticleId, "Wrong ID");

        uint256[] memory _articlesIds = buyerToArticles[_user];
    
        // loop and find if it has access
        uint256 len = _articlesIds.length;
        require(len != 0, "The user does not have access to any articles");
        for (uint256 i; i < len; i++) {
            // if we have a match return true
            if (_articlesIds[i] == _articleId) {
                return true;
            }
        }
        // if we did not return already, there was no match
        return false;
    }

    /// @notice get an article by its id
    function getArticle(uint256 _articleId) external view returns (Article memory) {
        require(_articleId <= nextArticleId, "Invalid ID");
        return articles[_articleId];
    }

    /// @notice get all articles ids for a user
    /// with the IDs it is possible to get the article data
    function getUserArticles(address _user) external view returns (uint256[] memory) {
        uint256[] memory ids = buyerToArticles[_user];
        require(ids.length != 0, "The user does not have access to any articles");
        return ids;
    }
}
