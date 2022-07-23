import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Pizzicato from 'pizzicato';

const Battles = ({
    account,
    myPlayers,
    tokens,
    contracts,
    onExit,
    myStakedPlayers,
    setTokens,
    onPopup,
  }) => {
  const [playerLimit, setPlayerLimit] = useState(0);
  const [betAmount, setBetAmount] = useState(0.01);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [start, setStart] = useState(false);
  const [gameScore, setGameScore] = useState(null);


  useEffect(() => {
    if (typeof contracts.FootballGame !== 'string' && playerLimit === 0) {
      contracts.FootballGame.getEnergy(1).call().then((playerHex) => {
        setPlayerLimit(Number(playerHex._hex) / 10);
      });
    }
  }, [contracts]); // eslint-disable-line react-hooks/exhaustive-deps


  const onScroll = () => {
    const scrollDiv = document.getElementById("scroll_anchor").offsetTop - 111;
    document.getElementsByClassName("cards_list")[0].scrollTo({ top: scrollDiv, behavior: 'smooth'});
	};

  const onSelectPlayer = (player) => {
    const gamePlayersTemp = [...gamePlayers];
    gamePlayersTemp.push(player);
    setGamePlayers(gamePlayersTemp);
	};

  const onRemovePlayer = (index) => {
    const gamePlayersTemp = [...gamePlayers];
    gamePlayersTemp.splice(index, 1)
    setGamePlayers(gamePlayersTemp);
	};

  const onStart = () => {
    if (betAmount >= 0.01 && betAmount <= Number((tokens.balls / 1e+18).toFixed(2))) {
      contracts.FootballGame.players().call().then((playerHex) => {
        // const address = window.tronLink.tronWeb.address.fromHex(playerHex);
        contracts.FootballGame.play(1, window.tronLink.tronWeb.toHex(betAmount * 1e+18)).send().then((resultGame) => {
          setStart(true);
          const checkEvent = setInterval(() => {
            fetch(`https://api.shasta.trongrid.io/v1/transactions/${resultGame}/events`, {
              method: 'GET',
              headers: { Accept: 'application/json' }
            }).then((response) => response.json()).then((response) => {
              if (response.data.length !== 0) {
                const sound = new Pizzicato.Sound('sound.mp3', () => {
                  sound.play();
                });

                clearInterval(checkEvent);

                setPlayerLimit(playerLimit - 1);

                let attackerScore = Math.ceil(Math.random() * 5);
                let defenderScore = Math.ceil(Math.random() * 5)
                if (response.data[0].result.result === '1') {
                  if (attackerScore <= defenderScore) {
                    attackerScore = Math.ceil(Math.random() * (5 - defenderScore + 1) + defenderScore + 1);
                  }
                  setTokens({...tokens, balls: tokens.balls + (betAmount * 1e+18) });
                } else if (response.data[0].result.result === '2') {
                  if (defenderScore <= attackerScore) {
                    defenderScore = Math.ceil(Math.random() * (5 - attackerScore + 1) + attackerScore + 1);
                  }
                  setTokens({...tokens, balls: tokens.balls - (betAmount * 1e+18) });
                } else {
                  attackerScore = defenderScore;
                }

                setGameScore({
                  attackerId: attackerScore,
                  defenderId: defenderScore,
                  score: Number(response.data[0].result.result),
                });
              }
            });
          }, 2000);
        });
      });
    } else {
      onPopup('error', 'Wrong bet amount');
    }
	};

  const onReStart = () => {
    setStart(false);
    setBetAmount(0);
    setGameScore(null);
	};

  return (
    <div className="container">
      <div className="header">
        <div className="title">Matches</div>
        <div className="subtitle">Each player has his own position on the field, keep balance and win the game</div>
        {account && (
            <div className="header_block">
              <div>
                <span style={{ background: '#3e4de5', display: 'flex', alignItems: 'center' }}>
                  <img src="./img/ball.png" alt="" />
                  <span>{(tokens.balls / 1e+18).toFixed(2)}</span>
                </span>
                <span style={{ background: '#3e4de5', display: 'flex', alignItems: 'center' }}>
                  <img src="./img/goal.png" alt="" />
                  <span>{(tokens.goals / 1e+18).toFixed(2)}</span>
                </span>
              </div>
              <div>
                <span>{`${account.name}: ${account.address}`}</span>
                <FontAwesomeIcon
                  icon={['fas', 'right-from-bracket']}
                  style={{ cursor: 'pointer' }}
                  onClick={onExit}
                />
              </div>
            </div>
          )}
      </div>
      <div className="cards_list">
        <div className="cards_list_inner">
          <div className="p2p_block">
            {!start ? (
              <>
                <div className="p2p_block_left">
                  <div className="subtitle">{`You have ${playerLimit} game for today`}</div>
                  <div className="subtitle">Your team for match</div>
                  {gamePlayers && gamePlayers.map((player, index) => (
                    <div className="p2p_position_block" key={player.id}>
                      <div className="p2p_position_name">{player.position}</div>
                      <div className="p2p_position_player">{`${player.name} (Rating: ${player.rating})`}</div>
                      <div className="p2p_position_clear">
                        <FontAwesomeIcon
                          icon={['fas', 'times']}
                          onClick={() => onRemovePlayer(index)}
                        />
                      </div>
                    </div>
                  ))}
                  {gamePlayers.length < 5 && (
                    <div
                      className="btn"
                      onClick={onScroll}
                      style={{ display: 'table', margin: '10px auto' }}
                    >Add player</div>
                  )}
                </div>
                <div className="p2p_block_right">
                  <img src="./img/map.png" alt="" />
                  <input
                    placeholder="Your bet"
                    type="text"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    style={{ width: 'calc(100% - 30px)', margin: '10px 0 0 0', height: 53 }}
                  />
                  <div
                    className="btn"
                    onClick={() => gamePlayers.length === 5 ? onStart() : ''}
                    style={gamePlayers.length === 5 ? {
                      margin: '10px 0 0 0'
                    } : {
                      margin: '10px 0 0 0',
                      pointerEvents: 'none',
                      opacity: 0.5,
                      cursor: 'default',
                    }}
                  >Play</div>
                </div>
              </>
            ) : (
              <div className="p2p_result">
                {gameScore ? (
                  <>
                    <div className="title">{`${gameScore.attackerId} : ${gameScore.defenderId}`}</div>
                    {gameScore.score === 0 && (
                      <div className="p2p_subtitle" style={{ width: 'unset' }}>Draw</div>
                    )}
                    {gameScore.score === 1 && (
                      <div className="p2p_subtitle" style={{ width: 'unset' }}>You Won</div>
                    )}
                    {gameScore.score === 2 && (
                      <div className="p2p_subtitle" style={{ width: 'unset' }}>You Lose</div>
                    )}
                    {(gameScore.score === 1 || gameScore.score === 2) && (
                      <div className="p2p_rewards">
                        <div>
                          <img src="./img/goal.png" alt="" />
                          {gameScore.score === 1 ? <span>{`+ ${betAmount}`}</span> : <span>{`- ${betAmount}`}</span>}
                        </div>
                      </div>
                    )}
                    <div
                      className="btn"
                      onClick={onReStart}
                      style={{ display: 'table', margin: '10px auto' }}
                    >Play again</div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>Loading</div>
                )}
              </div>
            )}
          </div>
          {!start && (
            <>
              <div className="p2p_subtitle" id="scroll_anchor">Pick up players for match</div>
              {myPlayers && myPlayers.map((player) => (gamePlayers.map((item) => item.id).indexOf(player.id) === -1 && (
                <div
                  key={player.id}
                  className="card"
                >
                  <img src={player.src} alt="" />
                  <div className="card_content">
                    <div className="card_number">{`NO. ${player.id}`}</div>
                    <div className="card_title">
                      <span>Name</span>
                      {` ${player.name}`}
                    </div>
                    <div className="card_title">
                      <span>Position</span>
                      {` ${player.position}`}
                    </div>
                    <div className="card_title">
                      <span>Rating</span>
                      {` ${player.rating}`}
                    </div>
                    {myStakedPlayers.indexOf(player.id) === -1 ? (
                      <div
                        className="btn"
                        onClick={() => gamePlayers.length < 5 ? onSelectPlayer(player) : ''}
                        style={gamePlayers.length < 5 ? {
                          margin: '20px 0 0 0'
                        } : {
                          margin: '20px 0 0 0',
                          pointerEvents: 'none',
                          opacity: 0.5,
                          cursor: 'default',
                        }}
                      >Add</div>
                    ) : (
                      <div
                        className="btn"
                        style={{
                          margin: '20px 0 0 0',
                          pointerEvents: 'none',
                          opacity: 0.5,
                          cursor: 'default',
                        }}
                      >Staking</div>
                    )}
                  </div>
                </div>
              )))}
              {myPlayers.length === 0 && ( 
                <div className="banner">
                  <Link
                    to="/marketplace"
                    className="btn"
                    style={{ marginTop: 10 }}
                  >Pick up the best player</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Battles;
