import React, {useState} from "react";
import styles from "../styles/Home.module.css";
import DefaultRSSComponent from "../components/DefaultRSSComponent";
import * as payWallConnect from "../services/payWallConnect";
import {purchaseSubscription} from "../services/payWallConnect";



export default function Home() {

    const [pageUrl, setPageUrl] = useState('');
    const [modalOpen, setModalOpen] = useState(0);

    const clickLoadArticle = (item) => {
        // TODO add local contract check for subscriber/past articles

        setPageUrl(item.link);

        // If get article url from backend check then update iframe
        payWallConnect.getNewsArticle(item.link).then(r => {

            setModalOpen(1);

            if(r.data && r.data != ''){
                //window.open(r.data, 'articleWindow', "toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=100,width=800,height=600");
            }else{
                //alert('need to pay mate');
            }
            console.log(r);
        }).catch(e => {
            console.log(e);
        });
    }

    const purchaseSubscription = () => {
        payWallConnect.purchaseSubscription().then( r => {
            console.log( r );
        }).catch( e => {
            alert(e);
            console.log(e);
        });
    }

    const purchaseArticle = (pageUrl) => {
        alert(`Buy Article ${pageUrl}`)

        /*
        payWallConnect.purchaseArticle().then( r => {
            console.log( r );
        }).catch( e => {
            console.log( e );
        });
         */
    }


  return (
    <div>
      <main className={styles.main}>
        <DefaultRSSComponent
            loadingComponent={() => <div>Loading default..</div>}
            errorComponent={() => <div>Sadly, no default rss :(</div>}
            handleClick={(item) => clickLoadArticle(item)}
            url={payWallConnect.getAPIEndpoint('news-feed')}
        />
          {modalOpen === 1 &&
            <div className={styles.modal}>

                <div className={styles.modalbody}>

                    <div className={styles.modalheader}>
                        Purchase Access to Article. <button onClick={evt => {setModalOpen(0);}}>X</button>
                    </div>

                    <button onClick={evt => {purchaseSubscription()}}>Lifetime Subscription (0.5 ETH)</button>

                    <button onClick={evt => {purchaseArticle()}}>Buy Article (0.01 ETH)</button>

                </div>

            </div>
          }
      </main>
    </div>
  );
}
