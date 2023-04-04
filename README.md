### WEB3 Content Paywall POC  

### Local Setup Clone Repo  
```
git clone https://github.com/ClearflySystems/web3-paywall.git 
```

#### Backend - init
``` 
cd /backend  
npm install  
```

#### Frontend - init  
``` 
cd /frontend  
npm install  
```

#### Blockchain - int  
```
cd /blockchain  
npm install  
npm hardhat init  
```

---

### Initial Project Idea

To Mimic content access we'll use 3rd party news feeds instead of a database and act as a proxy.  
Get an RSS feed from a news site as our initial frontend view. Modify urls to point to our backend.  
Requests for full article get passed to back end with signed request from front end wallet.  
Front end will offer PayNow or Subscribe Buttons  

Smart Contract checks for payment or subscription.  
a) Subscription check: store state list of subscribed address.  
b) Payment check: search address for previous transactions looking for state meta data of hash of content or url?? This needs researching.  

If successful backend delivers content to frontend. (mimic database call by http get to rss feed page)

Nice to haves:  
encrypt data so it can only be read on frontend with a wallet key of payer??

Sepolia network preferred.  
Fixed Fee of 0.00001 per article or lifetime subscription for 0.001  




---

### Initial Project Skelton  
Not required if cloning repo, for information purposes only.  

Initial Project was setup using Alchemy Install which uses a Nest.js frontend.  
This also setup a hardhat environment  
```npx create-web3-dapp@latest```  

After Alchemy install  
/backend renamed to /blockchain as we will use a NextJS backend  

Add NextJS Backend to handle frontend calls to get content - optional add swagger.  
```
nest new backend  
cd backend  
npm install  
npm install ethers  
npm install @nestjs/swagger  
```
