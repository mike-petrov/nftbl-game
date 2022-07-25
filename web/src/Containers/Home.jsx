import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Home = ({
  myPlayers,
  account,
  tokens,
  onConnect,
  onExit,
  isLoadingPlayers,
}) => {
  const [filter, setFilter] = useState('');

  const onFilter = (e) => {
		setFilter(e.target.value);
	};

  return (
    <div className="container">
      <div className="header">
        <div className="title">Team</div>
        <div className="subtitle">Your own football team</div>
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
          <div className="cards_filter">
            <div className="card_title">
              <span>Showing</span>
              {` ${myPlayers && myPlayers.filter((player) => player.name.toLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1).length} players`}
            </div>
            <input
              placeholder="Search for players"
              type="text"
              value={filter}
              onChange={onFilter}
              style={{ width: 'calc(50% - 40px)' }}
            />
          </div>
          <div className="cards_list">
            <div className="cards_list_inner">
              {isLoadingPlayers ? (
                <>
                  <div className="card">
                    <FontAwesomeIcon
                      icon={['fas', 'spinner']}
                      spin
                      style={{ margin: '20px auto', display: 'flex' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  {myPlayers && myPlayers.map((player) => (player.name.toLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1 && (
                    <div className="card" key={player.id}>
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
                      </div>
                    </div>
                  )))}
                  {myPlayers && myPlayers.length < 5 && (
                    <div className="card">
                      <img src="./img/players/0.png" alt=""/>
                      <div className="card_content">
                        <div className="card_title">
                          <span>Buy 5 players to assemble a team </span>
                        </div>
                      </div>
                      <Link
                        to="/marketplace"
                        className="btn"
                        style={{ margin: '0 20px 20px 20px' }}
                      >Buy players</Link>
                    </div>
                  )}
                </>
              )}
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
          <div className="banner_subtitle" style={{ fontSize: 10, marginTop: 10 }}>Get 10,000 TRX for Shasta Network from Twitter account <a href="https://twitter.com/TronTest2" rel="noopener noreferrer" target="_blank" style={{ textDecoration: 'underline', color: '#3e4de5' }}>@TronTest2</a></div>
        </div>
      )}
    </div>
  );
}

export default Home;
