
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// import registerServiceWorker from './registerServiceWorker';

import { BrowserRouter as Router, Route } from 'react-router-dom';
import Login from './components/Login'

class About extends React.Component{
    render(){
        return (
            <h1>About</h1>
        )
    }
}

ReactDOM.render(
    <Router>
        <div>
            <Route exact path="/" component={App} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/about" component={About} />
        </div>
    </Router>,
    document.getElementById('root'))
