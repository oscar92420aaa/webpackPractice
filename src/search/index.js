'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import './search.less';
import logo from './images/lvxing.jpeg';
import { common } from '../../common/index';

class Search extends React.Component {

    render() {
        debugger
        return <div className="search-text">
            搜索文字的内容111222<img src={ logo } />
        </div>;
    }
}

ReactDOM.render(
    <Search />,
    document.getElementById('root')
);