import React, { Component } from 'react';
import { connect } from 'react-redux';
import Canvas from './Canvas';
import '../App.css';
import { SET_NEW_WORD, SET_SKETCHY_FRIEND } from '../store';

class Game extends Component {

  constructor(props) {
    super(props)

    this.state = {
      input: '',
      gameCountDown: 3,
      word: null,
      sketchy: this.props.sketchy,
      points: 0,
      opponentPoints: 0,
      time: null,
      chatHistory: [],
      gameOver: false,
      round: 0,
      gameEndMessage: '',
      showPoints: false,
      canvas: () =>  <Canvas />
    }

    this.count = 3;

    if(this.props.socket === null) {
      this.props.history.push('/');
    } else {

      this.props.socket.on('message', data => {
        switch(data.OP) {
          case 'NEW_WORD':
            this.props.set_new_word(data.WORD);
            this.setState({ word: data.WORD });
            this.goodDraw = false;
            this.correctAnswer = false;
            this.state.round++;
            this.newCanvas();
            break;
          case 'SKETCHY_PLAYER':
            this.props.set_sketchy_friend(data.SKETCHY);
            this.setState({
              sketchy: data.SKETCHY
            });
            break;
          case 'GOOD_DRAW':
            this.setState({
              points: data.POINTS,
              opponentPoints: data.OPPONENT_POINTS
            });
            this.goodDraw = true;
            this.setState({
              pointsEarned: 1,
              opponentPointsEarned: 3,
              showPoints: true
            });
            setTimeout(() => {
              this.setState({
                showPoints: false
              });
              this.props.socket.emit('message', { OP: 'END_ROUND' });
            },3000);
            break;
          case 'CORRECT_ANSWER':
            this.setState({
              points: data.POINTS,
              opponentPoints: data.OPPONENT_POINTS,
              pointsEarned: 3,
              opponentPointsEarned: 1,
              showPoints: true
            });
            setTimeout(() => {
              this.setState({
                showPoints: false
              });
            },3000);
            this.correctAnswer = true;
            break;
          case 'TIMER':
            this.setState({
              time: data.TIME,
            });
            if(this.state.time === null && this.state.sketchy) {
              this.props.socket.emit('message', { OP: 'END_ROUND' });
            }
            break;
          case 'CHAT':
            let player;
            if(parseInt(data.PLAYER_NUM) === parseInt(this.props.playerNumber)) {
              player = 'you';
            } else {
              player = 'friend';
            }
            let chatHistory = this.state.chatHistory;
            chatHistory.push({ player, message: data.DATA });
  
            this.setState({
              chatHistory,
            });
            if(this.state.time === null && this.state.sketchy) {
              this.props.socket.emit('message', { OP: 'END_ROUND' });
            }
            break;
          case 'GAME_OVER':
            this.setState({
              gameOver: true
            });
 
            if(parseInt(this.state.points) > parseInt(this.state.opponentPoints)) {
              this.setState({
                gameEndMessage: 'You Win!'
              });
            }
            else if(parseInt(this.state.points) < parseInt(this.state.opponentPoints)) {
              this.setState({
                gameEndMessage: 'You lost :('
              });
            } 
            else if(parseInt(this.state.points) === parseInt(this.state.opponentPoints)) {
              this.setState({
                gameEndMessage: 'It was a tie!'
              });
            }
            break;
          default:
            break;
        }
      });
    }
  }

  newCanvas() {
    this.setState({
      canvas: () => <Canvas />
    });
  }

  componentDidMount() {
    this.counter=setInterval(this.timer.bind(this), 1000);
  }

  timer() {
    this.count=this.count-1;
    if (this.count <= 0) {
      clearInterval(this.counter);
      this.count = null;
      this.setState({ gameCountDown: this.count });
      if(this.props.sketchy) {
        this.props.socket.emit('message', { OP: 'START_GAME' });
      }
      return;
    }
    this.setState({ gameCountDown: this.count });
  }

  checkAnswer(e) {
    if (e.key === 'Enter') {
      if(e.target.value.toLowerCase() === this.state.word.toLowerCase() && !this.state.sketchy) {
        this.props.socket.emit('message', { OP: 'CORRECT_ANSWER' });
      }
      this.props.socket.emit('message', { OP: 'CHAT', value: e.target.value });
      e.target.value = '';
    }
  }

  render() {
    const GameCanvas = this.state.canvas;

    return (
      <div className="Game">
        <div className={ this.state.gameOver ? "game-header hidden" : "game-header" }>
          <img className="banner" src={require('../banner.png')}/>
          <p className={ this.state.sketchy ? "sketchy-word" : "sketchy-word hidden" }><span>Draw</span> { this.state.word }</p>
          <p className={ this.state.sketchy ? "hidden" : "" }>Guess the secret word!</p>
        </div>

        <div className={ this.state.time <= 5 ? "timer warning" : "timer" }>
          <p>{ this.state.time === null ? 20 : this.state.time }</p>
        </div>
        
        <div className={ this.state.gameCountDown === null ? "countdown hidden" : "countdown" }>
          <p>Game starts in</p>
          <p className="count">{ this.state.gameCountDown }</p>
        </div>
        
        <div className={ this.goodDraw ? "modal" : "modal hidden" }>
          <img src={require('../modal.png')} />
          <p className="modal-header">You're an artist!</p>
          <p className="modal-message">It's your turn to guess</p>
        </div>
        <div className={ this.correctAnswer ? "modal" : "modal hidden" }>
          <img src={require('../modal.png')} />
          <p className="modal-header">You got it!</p>
          <p className="modal-message">Get ready to draw</p>
        </div>
        <div className={ this.state.gameOver ? "modal" : "modal hidden" }>
          <img src={require('../modal.png')} />
          <p className="modal-header">GAME OVER</p>
          <p className="modal-message">{ this.state.gameEndMessage }</p>
        </div>

        <div className="players">
          <div className="players-content">
            <div className="round">
              <p>Round { this.state.round }/5</p>
            </div>
            <div className={ this.state.sketchy ? "player sketchy-player" : "player" }>
              <img src={require('../player.png')} className="player-image"/>
              <p className="you">You</p>
              <p className="points">{ this.state.points } PTS</p>
              <div className={ this.state.showPoints ? "points-earned": "hidden" }>
                <img src={require('../button2.png')} />
                <p>{ this.state.pointsEarned }+</p>
              </div>
            </div>
  
            <div className={ !this.state.sketchy ? "player sketchy-player" : "player" }>
              <img src={require('../player.png')} className="player-image"/>
              <p className="friend">Friend</p>
              <p className="points">{ this.state.opponentPoints } PTS</p>
              <div className={ this.state.showPoints ? "points-earned": "hidden" }>
                <img src={require('../button2.png')} />
                <p>{ this.state.opponentPointsEarned }+</p>
              </div>
            </div>
          </div>
        </div>

        <div className="canvas-container">
          <img className="canvas-image" src={require('../canvas.png')} />
          <GameCanvas timer={ this.state.time } />
        </div>

        <div className={ this.state.sketchy ? "chat" : "chat active" }>
          <img src={require('../chat.png')} className="chat-image" />
          <div className="chat-history-container">
            <div className="chat-history">
              {
                (this.state.chatHistory) ?  (
                  this.state.chatHistory.map((data) =>  {
                    return <p><span className={ data.player }>{ data.player }:</span> { data.message }</p>
                  })
                ) :  null
              }
            </div>
            <input type="text" onKeyPress={ this.checkAnswer.bind(this) } placeholder={ this.state.sketchy ? "" : "Enter answer here"} className={ this.state.sketchy ? "" : "guess"} />
          </div>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    set_new_word: word => {
      dispatch({ type: SET_NEW_WORD, word  });
    },
    set_sketchy_friend: sketchy => {
      dispatch({ type: SET_SKETCHY_FRIEND, sketchy  });
    }
  };
};

const mapStateToProps = (state) => state;
const ConnectedGame = connect(mapStateToProps, mapDispatchToProps)(Game);
export default ConnectedGame;
