import React, { FunctionComponent } from 'react';
import rssEnhancer, { InjectionRSSProps } from 'react-rss';

const DefaultRSSComponent: FunctionComponent<{ label: string } & InjectionRSSProps> = props => (
    <div>
        <h2>{props.label}</h2>
        <a href={props.rss.header.link}>
            {props.rss.header.title}
        </a>
        <ul>
            {props.rss.items.map(item => (
                <li dangerouslySetInnerHTML={{__html: item.description}}/>
            ))}
        </ul>
    </div>
);

export default rssEnhancer(
    DefaultRSSComponent,
    'http://localhost:4000/news-feed',
);
