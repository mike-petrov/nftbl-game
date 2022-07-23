import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Academy = ({
  onPopup,
  myPlayers,
  claimedBalls,
  claimedGoals,
  onGetClaimedBalles,
  onGetClaimedGoals,
  myStakedPlayers,
  account,
  tokens,
  onConnect,
  onExit,
  contracts,
  setMyStakedPlayers,
  myStakedBalls,
  onInit,
  isLoadingBalls,
  isLoadingGoals,
}) => {
  const [ballsAmount, setBallsAmount] = useState(0.01);

  const onStake = (id) => {
    contracts.BallV2.stake([id]).send().then(() => {
      setTimeout(() => {
        contracts.BallV2.myStakedPlayers().call().then((stakedPlayers) => {
          onPopup('success', 'This player is staking');
          const array = stakedPlayers.map((player) => Number(player._hex));
          setMyStakedPlayers(array);
        });
      }, 2000);
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
      }, 2000);
    });
	};

  const onUpgrade = (id) => {
    if (Number((tokens.goals / 1e+18).toFixed(2)) >= 0.01) {
      contracts.GoalV2.upgradePlayer(id, 1).send().then(() => {
        setTimeout(() => {
          onPopup('success', 'This player was upgraded');
        }, 2000);
      });
    } else {
      onPopup('error', `Not enough Goals for upgrade. Needs more than 0.01)`);
    }
	};

  const onClaimBalls = () => {
    contracts.BallV2.claimBalls(myPlayers.map((player) => player.id)).send().then(() => {
      setTimeout(() => {
        onPopup('success', 'Claimed Balls success');
        onInit();
      }, 2000);
    });
	};

  const onClaimGoals = () => {
    contracts.GoalV2.claimGoal().send().then(() => {
      setTimeout(() => {
        onPopup('success', 'Claimed Goals success');
        onInit();
      }, 2000);
    });
	};

  const onStakeBalls = () => {
    if (ballsAmount >= 0.01 && ballsAmount <= Number((tokens.balls / 1e+18).toFixed(2))) {
      contracts.GoalV2.staking(window.tronLink.tronWeb.toHex(ballsAmount * 1e+18)).send().then(() => {
        setTimeout(() => {
          onPopup('success', 'Your Balls was staked');
          onInit();
        }, 2000);
      });
    } else {
      onPopup('error', 'Wrong Balls amount');
    }
	};

  const onUnstakeBalls = () => {
    contracts.GoalV2.withdrawAllBallsAndClaimGoal().send().then(() => {
      setTimeout(() => {
        onPopup('success', 'Your Balls was received');
        onInit();
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
                    onClick={() => onGetClaimedBalles()}
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
                >Unstake All Balls</div>
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
