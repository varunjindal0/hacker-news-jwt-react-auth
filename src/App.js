
import React, { Component } from 'react';
import upvote from './upvote.svg';
import './App.css';


import InfiniteScroll from 'react-infinite-scroller';

import AuthService from './components/AuthService';

const Auth = new AuthService();

class Score extends Component{
  constructor(props){
    super(props);
    let initialValue=false;
    for(let i=0; i<this.props.likedPostIdsByLoggedInUser.length;i++){
      if(this.props.likedPostIdsByLoggedInUser[i]===this.props.entry.id){
        initialValue=true;
      }
    }
    this.state= {score: this.props.entry.score , votedAlready: initialValue}   
    
  }
  submitVote=(weight)=>{
    if(!Auth.loggedIn()){
      console.log("You are not loggedIn----- First do that!!")
      this.props.history.push('/login')
    } else {
      console.log(Auth.getProfile().user_db_id);
    let userJson = Auth.getProfile();
    let voteWeight = weight;
    const headers = {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          }
    this.setState({score: parseInt(this.state.score, 10)+parseInt(voteWeight, 10), votedAlready: !this.state.votedAlready})
    fetch('http://localhost:8080/upvote', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      postId: this.props.entry.id,
      ourScore: voteWeight,
      user_db_id: userJson.user_db_id
    })
    })
    }
    
  }
  render(){
    let upVoteWeight = '50';
    let downVoteWeight = '-50';
    return (
      <div>{!this.state.votedAlready||!this.props.isLoggedIn?<img src={upvote} onClick={()=>{this.submitVote(upVoteWeight)}} alt="upvote"/>: null}{" Points: "+this.state.score + " "}{this.state.votedAlready && this.props.isLoggedIn?<u onClick={()=>{this.submitVote(downVoteWeight)}}>unvote</u>: null}</div>
    )
  }
}

function NewsEntry(props){
  return (
    <div className='NewsEntry' >
      <a href={props.entry.url} target="_blank"> {props.entry.title} </a>
      <Score isLoggedIn={props.isLoggedIn} history={props.history} likedPostIdsByLoggedInUser={props.likedPostIdsByLoggedInUser} entry={props.entry}/>
    </div>
  )
}

class App extends Component {
  constructor(props){
    super(props);
    this.state = {topStories: [], News: [], isLoggedIn: Auth.loggedIn()}
    this.index = 0;
    this.noOfElementsInOneGo = 20;
    this.loadMore= true;
    this.likedPostIdsByLoggedInUser = [];
  }

  componentDidMount() {
    this.fetchTopStories()
    // this.fetchScoresOfPosts();
    console.log("*******************************************************")
    if(Auth.loggedIn()){
      fetch('http://localhost:8080/'+Auth.getProfile().user_db_id+'/voted')
      .then(postIds=>postIds.json())
      .then(jsonResponse=>{
        console.log(jsonResponse);
        this.likedPostIdsByLoggedInUser = jsonResponse;
      })
    }
    
  }

  renderPosts(newArray){
    console.log("I am in the renderPosts() function!");
    Promise.all(newArray.map(id=>{
      return fetch('https://hacker-news.firebaseio.com/v0/item/'+id+'.json?print=pretty')
    })
    )
    .then(responses=>{
      console.log("-----"+responses);
      Promise.all(responses.map(res=>res.json()))
      .then(jsonResponses=>{
        console.log("###############################"+jsonResponses)


       // ***********************************************************************

        Promise.all(jsonResponses.map(news=>{
          console.log(news.id + ': ' + news.score)
          return fetch('http://localhost:8080/upvotes/'+news.id)
        }))
        .then(responses=>{
          Promise.all(responses.map(response=>response.json()))
          .then(ourValues=>{
            console.log("================================================")

            for(let i=0; i<ourValues.length; i++){
              jsonResponses[i].score = parseInt(jsonResponses[i].score, 10) + parseInt(ourValues[i].ourScore, 10);
            }

            // jsonResponses.map(elem=>{
            //   console.log(elem.id+': '+elem.score)
            // })
            if(this.state.News.length>0){
              let arr = this.state.News.concat(jsonResponses)
              console.log("---------------------------"+ arr.length )
              console.log(arr)
              this.setState({News: arr});
              } else {
                this.setState({News: jsonResponses})
               }
          })
        })
        

       // **********************************************************************
      })
    })
  }

  fetchTopStories(){
    console.log('fetchTopStories() was called')
    fetch('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty')
    .then(response => {
      return response.json();
    })
    .then(jsonResponse=>{
      this.setState({topStories: Array.from(jsonResponse)}, ()=>{
        // this ensures that setState is completely executed : setState() is asynchronous
        let newArray = this.state.topStories.slice(this.index, this.index + this.noOfElementsInOneGo)
        this.renderPosts(newArray);
        this.index = this.index + this.noOfElementsInOneGo;
      })
      // console.log(this.state.topStories+" :::: "+this.state.topStories[4]);
    })
    .catch(err=>console.log(err))
   }


  loadFunc=()=>{
    console.log("I am in the loadFunc()-------------")
    let newArray = this.state.topStories.slice(this.index, (this.index+this.noOfElementsInOneGo)<this.state.topStories.length?this.index+this.noOfElementsInOneGo: this.state.topStories.length);
    this.renderPosts(newArray);
    if(this.index + this.noOfElementsInOneGo<this.state.topStories.length){
      this.index  = this.index+this.noOfElementsInOneGo;
    } else {
      this.loadMore = false;
    }
    
  }

  onlogoutClick=()=>{
        Auth.logout()
        // this.props.history.replace('/login');
        this.setState({isLoggedIn: false});
     }
   onloginClick=()=>{
      console.log("Login Area was clicked!!")
      this.props.history.push('/login');
    }
  render() {
    console.log('I am in render()-APP')
    if(this.state.isLoggedIn){
      console.log('I am in render()-APP'+ Auth.getProfile())
    }
      return (
        <div className='container'>
          {this.state.isLoggedIn?<div className='LoginArea'><span>{"Hi "+ Auth.getProfile().username.charAt(0).toUpperCase()+Auth.getProfile().username.slice(1)}</span><button onClick={this.onlogoutClick}>Logout!!</button></div>:<div className='LoginArea'><span> Please Login to upVote----></span><button onClick={this.onloginClick}>Login!!</button></div>}
        
          <ol className='ListItems' >
          <InfiniteScroll
              pageStart={0}
              loadMore={this.loadFunc}
              initialLoad= {false}
              hasMore={this.loadMore}
              loader={<div className="loader" key={0}>Loading ...</div>}
          >
            
              {
                this.state.News.map(elem=>{
                  return (
                    <li key={elem.id}>
                      {/* <a href={elem.url}>{elem.title}</a> Score: {elem.score} */}
                      <NewsEntry isLoggedIn={this.state.isLoggedIn} history={this.props.history} likedPostIdsByLoggedInUser={this.likedPostIdsByLoggedInUser} entry={elem} />
                    </li> 
                  
                  )
                })
              }

          </InfiniteScroll>
          </ol>
        </div>
      )
   // }
  }
}

export default App;

