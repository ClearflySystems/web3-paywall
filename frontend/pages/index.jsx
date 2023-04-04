import React from "react";
import styles from "../styles/Home.module.css";
import DefaultRSSComponent from "../components/DefaultRSSComponent";

export default function Home() {
  return (
    <div>
      <main className={styles.main}>
        <DefaultRSSComponent
            loadingComponent={() => <div>Loading default..</div>}
            errorComponent={() => <div>Sadly, no default rss :(</div>}
        />
          <div className={styles.newsitem}>

          </div>
      </main>
    </div>
  );
}
