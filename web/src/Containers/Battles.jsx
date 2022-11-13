import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Pizzicato from 'pizzicato';

const Battles = ({
    account,
    players,
    myPlayers,
    tokens,
    contracts,
    onExit,
    myStakedPlayers,
    setTokens,
    onPopup,
    isLoadingPlayers,
  }) => {
  const [registeredTeam, setRegisteredTeam] = useState(null);
  const [betAmount, setBetAmount] = useState(0.01);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [start, setStart] = useState(false);
  const [gameScore, setGameScore] = useState(null);
  const [gameType, setGameType] = useState('real');

  useEffect(() => {
    if (typeof contracts.FootballGame !== 'string' && registeredTeam === null) {
      contracts.FootballGame.getRegisteredTeam(window.tronLink.tronWeb.defaultAddress.base58).call().then((registeredTeamTemp) => {
        console.log(registeredTeamTemp);
        setRegisteredTeam(registeredTeamTemp.map((item) => Number(item._hex)));
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
      onPopup('loading');
      contracts.FootballGame.play(gamePlayers.map((item) => item.id), window.tronLink.tronWeb.toHex(betAmount * 1e+18)).send().then((resultGame) => {
        onPopup();
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

              if (response.data[0].result.matchResult === '1') {
                setTokens({...tokens, balls: tokens.balls + (betAmount * 1e+18) });
              } else if (response.data[0].result.matchResult === '2') {
                setTokens({...tokens, balls: tokens.balls - (betAmount * 1e+18) });
              }

              setGameScore({
                attackerTeam: response.data[0].result.attackerTeam.split('\n').map((item) => Number(item)),
                defenderTeam: response.data[0].result.defenderTeam.split('\n').map((item) => Number(item)),
                playersResult: response.data[0].result.playersResult.split('\n').map((item) => Number(item)),
                matchResult: Number(response.data[0].result.matchResult),
              });
            }
          });
        }, 2000);
      });
    } else {
      onPopup('error', 'Wrong bet amount');
    }
	};

  const onRegister = () => {
    onPopup('loading');
    contracts.FootballGame.register(gamePlayers.map((item) => item.id)).send().then((statusTeam) => {
      onPopup('success', 'Your team has been registered');
      setGamePlayers([]);
      setTimeout(() => {
        contracts.FootballGame.getRegisteredTeam(window.tronLink.tronWeb.defaultAddress.base58).call().then((registeredTeamTemp) => {
          setRegisteredTeam(registeredTeamTemp.map((item) => Number(item._hex)));
        });
      }, 500);
    });
	};

  const onUnregister = () => {
    onPopup('loading');
    contracts.FootballGame.unregister().send().then((statusTeam) => {
      onPopup('success', 'Your team has been unregistered');
      setTimeout(() => {
        setRegisteredTeam([]);
      }, 500);
    });
	};

  const onReStart = () => {
    setStart(false);
    setBetAmount(0.01);
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
        {gameType === null ? (
          <>
            <div className="p2p_subtitle">Choose game mode</div>
            <div className="cards_list_inner">
              <div className="card">
                <img src="/img/team.png" alt="" />
                <div className="card_content">
                  <div className="card_number">Pro</div>
                  <div className="card_title">
                    Against Real Opponents
                  </div>
                  <div className="card_title">
                    <span>To make your team perform, you’ll need to choose the right tactics, line-ups and approach to out-wit your real opponent</span>
                  </div>
                  <div
                    className="btn"
                    style={{ margin: '20px 0 0 0' }}
                    onClick={() => setGameType('real')}
                  >Select</div>
                </div>
              </div>
              <div className="card">
                <img src="/img/coming_soon.png" alt="" />
                <div className="card_content">
                  <div className="card_number">...</div>
                  <div className="card_title">
                    Coming soon
                  </div>
                  <div className="card_title">
                    <span>We are preparing for you a huge number of game mods with different scenarios that you will play with pleasure</span>
                  </div>
                  <div
                    className="btn"
                    style={{
                      margin: '20px 0 0 0',
                      pointerEvents: 'none',
                      opacity: 0.5,
                      cursor: 'default',
                    }}
                  >Select</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            className="p2p_subtitle"
            onClick={() => setGameType(null)}
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >← Change game mode</div>
        )}
        {gameType === 'real' && (
          <div className="cards_list_inner">
            <div className="p2p_block" style={{ marginBottom: 20, display: 'block' }}>
              {registeredTeam === null ? (
                <>
                  <div className="subtitle" >Registered team</div>
                  <FontAwesomeIcon
                    icon={['fas', 'spinner']}
                    spin
                    style={{ margin: '20px auto', display: 'flex' }}
                  />
                </>
              ) : (
                <>
                  {registeredTeam.length === 0 ? (
                    <>
                      <div className="subtitle">Registered team not found</div>
                      <span
                        style={{
                          textAlign: 'center',
                          display: 'block',
                          fontSize: 14,
                          maxWidth: 700,
                          margin: 'auto',
                        }}
                      >Each player can register his team to participate in matches, thereby your team will be in the pool of all teams to play. Players can play with your team and you can earn from each winning match!</span>
                    </>
                  ) : (
                    <>
                      <div className="subtitle" >Registered team</div>
                      <div className="cards_list cards_list_mini cards_list_block">
                        <div className="cards_list_inner">
                          {registeredTeam && players.filter((playerItem) => registeredTeam.indexOf(playerItem.id) !== -1).sort((a, b) => registeredTeam.indexOf(a.id) - registeredTeam.indexOf(b.id)).map((player, index) => (
                            <div
                              key={player.id}
                              className="card"
                              style={{
                                filter: 'drop-shadow(0px 0px 8px)',
                                color: '#3e4de4'
                              }}
                            >
                              <img src={player.src} alt="" />
                            </div>
                          ))}
                        </div>
                        <div
                          className="btn"
                          onClick={() => onUnregister()}
                          style={{ margin: 0 }}
                        >Unregister team</div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="p2p_block">
              {!start ? (
                <>
                  <div className="p2p_block_left">
                    <div className="team_block">
                      <div className="subtitle">Select your best players</div>
                      {gamePlayers && gamePlayers.map((player, index) => (
                        <div className="team_player_block" key={player.id} style={{ background: '#1c1c1c' }}>
                          <img src={player.src} alt="" />
                          <div className="team_player_number">{`NO. ${player.id}`}</div>
                          <div className="team_player_position">{player.position}</div>
                          <div className="team_player_name">{`${player.name} (Rating: ${player.rating})`}</div>
                          <div className="team_player_btn">
                            <div
                              className="btn"
                              onClick={() => onRemovePlayer(index)}
                              style={{ background: '#e74c3c'}}
                            >Remove</div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                      placeholder="Your Balls bet"
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
                    >Play with opponent</div>
                    {(registeredTeam === null || (registeredTeam !== null && registeredTeam.length === 0)) && (
                      <div
                        className="btn"
                        onClick={() => gamePlayers.length === 5 ? onRegister() : ''}
                        style={gamePlayers.length === 5 ? {
                          margin: '10px 0 0 0'
                        } : {
                          margin: '10px 0 0 0',
                          pointerEvents: 'none',
                          opacity: 0.5,
                          cursor: 'default',
                        }}
                      >Register for games</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p2p_result">
                  {gameScore ? (
                    <>
                      {gameScore.matchResult === 0 && (
                        <>
                          <div className="p2p_subtitle subtitle_gradient_gray" style={{ width: 'unset', fontSize: 30 }}>Draw</div>
                          <div className="title subtitle_gradient_gray">
                            {`${gameScore.playersResult.filter((item) => item === 1).length} : ${gameScore.playersResult.filter((item) => item === 2).length}`}
                          </div>
                        </>
                      )}
                      {gameScore.matchResult === 1 && (
                        <>
                          <div className="p2p_subtitle subtitle_gradient_green" style={{ width: 'unset', fontSize: 30 }}>You Won</div>
                          <div className="title subtitle_gradient_green">
                            {`${gameScore.playersResult.filter((item) => item === 1).length} : ${gameScore.playersResult.filter((item) => item === 2).length}`}
                          </div>
                        </>
                      )}
                      {gameScore.matchResult === 2 && (
                        <>
                          <div className="p2p_subtitle subtitle_gradient_red" style={{ width: 'unset', fontSize: 30 }}>You Lose</div>
                          <div className="title subtitle_gradient_red">
                            {`${gameScore.playersResult.filter((item) => item === 1).length} : ${gameScore.playersResult.filter((item) => item === 2).length}`}
                          </div>
                        </>
                      )}
                      <div className="cards_list cards_list_mini">
                        <div className="cards_list_inner">
                        {players.filter((playerItem) => gameScore.attackerTeam.indexOf(playerItem.id) !== -1).sort((a, b) => gameScore.attackerTeam.indexOf(a.id) - gameScore.attackerTeam.indexOf(b.id)).map((player, index) => (
                          <div
                            key={player.id}
                            className="card"
                            style={gameScore.playersResult[index] === 2 ? {
                              filter: 'grayscale(1)',
                            } : {
                              filter: 'drop-shadow(0px 0px 8px)',
                              color: '#3e4de4'
                            }}
                          >
                            {gameScore.playersResult[index] === 1 && (
                              <div className="card_goal">Goal</div>
                            )}
                            <img src={player.src} alt="" />
                          </div>
                        ))}
                        </div>
                        vs
                        <div className="cards_list_inner">
                        {players.filter((playerItem) => gameScore.defenderTeam.indexOf(playerItem.id) !== -1).sort((a, b) => gameScore.defenderTeam.indexOf(a.id) - gameScore.defenderTeam.indexOf(b.id)).map((player, index) => (
                          <div
                            key={player.id}
                            className="card"
                            style={gameScore.playersResult[index] === 1 ? {
                              filter: 'grayscale(1)',
                            } : {
                              filter: 'drop-shadow(0px 0px 8px)',
                              color: '#3e4de4'
                            }}
                          >
                            {gameScore.playersResult[index] === 2 && (
                              <div className="card_goal">Goal</div>
                            )}
                            <img src={player.src} alt="" />
                          </div>
                        ))}
                        </div>
                      </div>
                      {(gameScore.matchResult === 1 || gameScore.matchResult === 2) && (
                        <div className="p2p_rewards">
                          <div>
                            <img src="./img/goal.png" alt="" />
                            {gameScore.matchResult === 1 ? <span>{`+ ${betAmount}`}</span> : <span>{`- ${betAmount}`}</span>}
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
                    <div style={{ textAlign: 'center' }}>Match in progress...</div>
                  )}
                </div>
              )}
            </div>
            {!start && (
              <>
                <div className="p2p_subtitle" id="scroll_anchor">Pick up players for match</div>
                {isLoadingPlayers ? (
                  <div className="card" style={{ margin: 'auto' }}>
                    <FontAwesomeIcon
                      icon={['fas', 'spinner']}
                      spin
                      style={{ margin: '20px auto', display: 'flex' }}
                    />
                  </div>
                ) : (
                  <>
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
                            <>
                              {(registeredTeam === null || (registeredTeam && registeredTeam.indexOf(player.id) === -1)) ? (
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
                                >Registered for team</div>
                              )}
                            </>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Battles;
