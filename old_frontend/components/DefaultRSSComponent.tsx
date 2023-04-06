import React, { FunctionComponent, useId } from 'react';
import rssEnhancer, { InjectionRSSProps } from 'react-rss';


const DefaultRSSComponent: FunctionComponent<{ label: string } & InjectionRSSProps> = props => (
    <div>
        <h2>{props.label}</h2>
        <a href={props.rss.header.link}>{props.rss.header.title}</a>
        <ul>
            {props.rss.items.map(item => (
                <li key={useId()} dangerouslySetInnerHTML={{__html: item.description}} onClick={evt => {props.handleClick(item);}}/>
            ))}
        </ul>
    </div>
);

export default rssEnhancer(
    DefaultRSSComponent
);
