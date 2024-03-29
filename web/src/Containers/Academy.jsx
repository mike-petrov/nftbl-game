import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

const Academy = ({
  onPopup,
  myPlayers,
  claimedBalls,
  claimedGoals,
  onGetClaimedBalls,
  onGetClaimedGoals,
  myStakedPlayers,
  account,
  tokens,
  onConnect,
  onExit,
  contracts,
  setMyStakedPlayers,
  myStakedBalls,
  isLoadingBalls,
  isLoadingGoals,
  onBalance,
  isInitAcademy,
  setInitAcademy,
  onGetMyStakedBalls,
  isLoadingPlayers,
}) => {
  useEffect(() => {
    if (typeof contracts.FootballGame !== 'string' && !isInitAcademy) {
      setInitAcademy(true);
  
      onGetMyStakedBalls();
      onGetClaimedBalls();
      onGetClaimedGoals();
    }
  }, [contracts]); // eslint-disable-line react-hooks/exhaustive-deps

  const [ballsAmount, setBallsAmount] = useState(0.01);

  const onStake = (id) => {
    contracts.BallV2.stake([id]).send().then(() => {
      setTimeout(() => {
        contracts.BallV2.myStakedPlayers().call().then((stakedPlayers) => {
          onPopup('success', 'This player is staking');
          const array = stakedPlayers.map((player) => Number(player._hex));
          setMyStakedPlayers(array);
        });
      }, 3000);
    });
	};

  const onUnstake = (id) => {
    contracts.BallV2.unstake([id]).send().then(() => {
      setTimeout(() => {
        contracts.BallV2.myStakedPlayers().call().then((stakedPlayers) => {
          onPopup('success', 'This player was unstaked');
          const array = stakedPlayers.map((player) => Number(player._hex));
          setMyStakedPlayers(array);
        });
      }, 3000);
    });
	};

  const onUpgrade = (id) => {
    if (Number((tokens.goals / 1e+18).toFixed(2)) >= 0.01) {
      onPopup('loading');
      contracts.GoalV2.upgradePlayer(id, 1).send().then(() => {
        setTimeout(() => {
          onPopup('success', 'This player was upgraded');
        }, 3000);
      });
    } else {
      onPopup('error', `Not enough Goals for upgrade. Needs more than 0.01)`);
    }
	};

  const onClaimBalls = () => {
    onPopup('loading');
    contracts.BallV2.claimBalls(myPlayers.map((player) => player.id)).send().then(() => {
      setTimeout(() => {
        onPopup('success', 'Claimed Balls success');
        onGetClaimedBalls();
        onBalance();
      }, 3000);
    });
	};

  const onClaimGoals = () => {
    onPopup('loading');
    contracts.GoalV2.claimGoal().send().then(() => {
      setTimeout(() => {
        onPopup('success', 'Claimed Goals success');
        onGetClaimedGoals();
        onBalance();
      }, 3000);
    });
	};

  const onStakeBalls = () => {
    if (ballsAmount >= 0.01 && ballsAmount <= Number((tokens.balls / 1e+18).toFixed(2))) {
      onPopup('loading');
      contracts.GoalV2.staking(window.tronLink.tronWeb.toHex(ballsAmount * 1e+18)).send().then(() => {
        setTimeout(() => {
          onPopup('success', 'Your Balls was staked');
          onGetMyStakedBalls();
          onBalance();
        }, 3000);
      });
    } else {
      onPopup('error', 'Wrong Balls amount');
    }
	};

  const onUnstakeBalls = () => {
    onPopup('loading');
    contracts.GoalV2.withdrawAllBallsAndClaimGoal().send().then(() => {
      setTimeout(() => {
        onPopup('success', 'Your Balls was received');
        onGetMyStakedBalls();
        onGetClaimedBalls();
        onBalance();
      }, 3000);
    });
	};

  return (
    <div className="container">
      <div className="header">
        <div className="title">Academy</div>
        <div className="subtitle">Your team will be taught a lot here</div>
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
      {account ? (
        <>
          <div className="cards_list">
            <div className="banner banner_academy">
              <img className="banner_intro" src="./img/intro.png" alt="" />
            </div>
            <div className="banner banner_academy">
              <div className="banner_title">
                <span>{`1. Staking players (${myStakedPlayers.filter((stakedPlayer) => stakedPlayer > 0).length} / ${myPlayers.length})`}</span>
                <span>
                  <img src="./img/ball.png" alt="" />
                  {(claimedBalls / 1e+18).toFixed(2)}
                  <FontAwesomeIcon
                    icon={['fas', 'rotate']}
                    spin={isLoadingBalls}
                    style={isLoadingBalls ? { cursor: 'pointer', marginLeft: 10, pointerEvents: 'none' } : { cursor: 'pointer', marginLeft: 10 }}
                    onClick={() => onGetClaimedBalls()}
                  />
                  <div
                    className="btn"
                    onClick={onClaimBalls}
                    style={Number((claimedBalls / 1e+18).toFixed(2)) < 0.01 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                  >Claim</div>
                </span>
              </div>
              <div className="banner_content">
                <div className="team_block">
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
                      {myPlayers && myPlayers.map((player) => (
                        <div className="team_player_block" key={player.id}>
                          <img src={player.src} alt="" />
                          <div className="team_player_number">{`NO. ${player.id}`}</div>
                          <div className="team_player_position">{player.position}</div>
                          <div className="team_player_name">{`${player.name} (Rating: ${player.rating})`}</div>
                          <div className="team_player_btn">
                            {myStakedPlayers.indexOf(player.id) !== -1 ? (
                              <div
                                className="btn"
                                onClick={() => onUnstake(player.id)}
                              >Unstake</div>
                            ) : (
                              <div
                                className="btn"
                                onClick={() => onStake(player.id)}
                              >Stake</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {myPlayers.length === 0 && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            maxWidth: 350,
                            margin: 'auto',
                          }}
                        >
                          <Link
                            to="/marketplace"
                            className="btn"
                          >Buy player</Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="banner banner_academy">
              <div className="banner_title">
                <span>
                  {`2. Staking balls `}
                  <span style={{ fontSize: 14 }}>{`(${(myStakedBalls / 1e+18).toFixed(2)} / ${(Number((myStakedBalls / 1e+18).toFixed(2)) + Number((tokens.balls / 1e+18).toFixed(2))).toFixed(2)})`}</span>
                </span>
                <span>
                  <img src="./img/goal.png" alt="" />
                  {(claimedGoals / 1e+18).toFixed(2)}
                  <FontAwesomeIcon
                    icon={['fas', 'rotate']}
                    spin={isLoadingGoals}
                    style={isLoadingGoals ? { cursor: 'pointer', marginLeft: 10, pointerEvents: 'none' } : { cursor: 'pointer', marginLeft: 10 }}
                    onClick={() => onGetClaimedGoals()}
                  />
                  <div
                    className="btn"
                    onClick={onClaimGoals}
                    style={Number((claimedGoals / 1e+18).toFixed(2)) < 0.01 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                  >Claim</div>
                </span>
              </div>
              <div
                className="banner_content"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  maxWidth: 350,
                }}
              >
                <input
                  type="text"
                  value={ballsAmount}
                  onChange={(e) => setBallsAmount(e.target.value)}
                  style={{ width: 'calc(100% - 40px)', margin: '0 5px 5px 5px', height: 53 }}
                />
                <div
                  className="btn"
                  onClick={() => onStakeBalls()}
                  style={Number((tokens.balls / 1e+18).toFixed(2)) < 0.01 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                >Stake Balls</div>
                <div
                  className="btn"
                  onClick={() => onUnstakeBalls()}
                  style={Number((myStakedBalls / 1e+18).toFixed(2)) < 0.01 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                >
                  Unstake All Balls
                  <div style={{ fontSize: 12, color: '#fdd836' }}>fee ~8.3%</div>
                </div>
              </div>
            </div>
            <div className="banner banner_academy">
              <div className="banner_title">
                <span>3. Upgrading players</span>
                <span style={{ padding: 6 }}>
                  {`${myStakedPlayers.filter((stakedPlayer) => stakedPlayer > 0).length} players`}
                </span>
              </div>
              <div className="banner_content">
                <div className="team_block">
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
                      {myPlayers && myPlayers.map((player) => (myStakedPlayers.indexOf(player.id) !== -1 && (
                        <div className="team_player_block" key={player.id}>
                          <img src={player.src} alt="" />
                          <div className="team_player_number">{`NO. ${player.id}`}</div>
                          <div className="team_player_position">{player.position}</div>
                          <div className="team_player_name">{`${player.name} (Rating: ${player.rating})`}</div>
                          <div className="team_player_btn">
                            <div
                              className="btn"
                              onClick={() => onUpgrade(player.id)}
                            >Upgrade</div>
                          </div>
                        </div>
                      )))}
                      {myStakedPlayers.filter((stakedPlayer) => stakedPlayer > 0).length === 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          Stake your player for upgrading
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="banner">
          <img src="./img/star.png" alt="" />
          <div className="banner_title">Let's play</div>
          <div className="banner_subtitle">To get started, connect your wallet</div>
          <div
            className="btn"
            style={{ marginTop: 20 }}
            onClick={onConnect}
          >Connect wallet <FontAwesomeIcon icon={['fas', 'link']} /></div>
        </div>
      )}
    </div>
  );
}

export default Academy;
