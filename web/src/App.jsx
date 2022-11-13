import React, { useEffect, useState } from 'react';
import {
	Route, Routes, Link, useLocation,
} from 'react-router-dom';

import Home from './Containers/Home.jsx';
import Academy from './Containers/Academy.jsx';
import Battles from './Containers/Battles.jsx';
import Marketplace from './Containers/Marketplace.jsx';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
    faTimes,
    faSpinner,
    faLink,
    faRightFromBracket,
    faCheck,
    faRotate,
    faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import {
    faHeart,
} from '@fortawesome/free-regular-svg-icons';
import {
    faDiscord,
} from '@fortawesome/free-brands-svg-icons';
import Players from './players.jsx';
import './App.css';

library.add(
	faTimes,
  faHeart,
  faSpinner,
  faRightFromBracket,
  faLink,
  faCheck,
  faRotate,
  faDiscord,
  faCircleInfo,
);

// const TronWeb = require('tronweb');
// const tronWeb = new TronWeb({
//   fullHost: 'https://api.shasta.trongrid.io/',
// })

const App = () => {
  const location = useLocation();

  const [contracts, setContracts] = useState({
    // PlayersV4: 'TWL74pz2Tfnzhf9K9B4ERKWLdXK6BqiY8E',
    // BallV2: 'TTANLJLpu8e8MECcQBf2BMCCweRSa5k9QS',
    // GoalV2:  'TYUHeyERNyJ5kQMebDq1trrscARPcJbf1u',
    // FootballGame: 'TVifaRyAXX7SiMy28B2kFC4nAdUGAnTe7c',
    PlayersV4: 'TAchyfWgC6TFMohMMFSRX9EJFLTrJMdK3U',
    BallV2: 'TLvCD3m9oyNBqgG8GWdfLdiT6TWW1iwkb7',
    GoalV2:  'TP5EwkNemPSkeocaJNwTFao5r9aYiYKyYy',
    FootballGame: 'TSkeC61NTVC8Hb16hiXcp67eUAAbBYKSxF',
  });
  const [isInit, setInit] = useState(false);
  const [isInitAcademy, setInitAcademy] = useState(false);
  const [isLoadingPlayers, setLoadingPlayers] = useState(true);
  const [isLoadingBalls, setLoadingBalls] = useState(false);
  const [isLoadingGoals, setLoadingGoals] = useState(false);
  const [account, setAccount] = useState(null);
  const [claimedBalls, setClaimedBalls] = useState(0);
  const [claimedGoals, setClaimedGoals] = useState(0);
  const [myStakedBalls, setMyStakedBalls] = useState(0);
  const [tokens, setTokens] = useState({
    balls: 0,
    goals: 0,
  });
  const [myPlayers, setMyPlayers] = useState([]);
  const [myStakedPlayers, setMyStakedPlayers] = useState([]);
  const [players] = useState(Players);
  const [popup, setPopup] = useState({ current: null, item: null });

  useEffect(() => {
    window.addEventListener('message', (e) => {
      if (e.data.message && e.data.message.action === "tabReply") {
        console.log("tabReply event", e.data.message);
        if (e.data.message.data.data.node && e.data.message.data.data.node.name && e.data.message.data.data.node.name !== "Shasta Testnet") {
          onPopup('error', 'Choose Shasta Testnet in TronLin extension');
        } else if (e.data.message.data.data.isAuth) {
          setAccount(e.data.message.data.data);
          setTimeout(() => {
            onActivateContracts();
          }, 1000);
        } else if (e.data.message.data.data === 'Confirmation declined by user') {
          onPopup('error', 'Confirmation declined by user');
        } else if (e.data.message.data.data.address === false || e.data.message.data.data === '') {
          onPopup('error', 'TronLink extension locked');
        }
      }

      if (e.data.message && e.data.message.action === "setAccount") {
        console.log("setAccount event", e.data.message);
        console.log("current address:", e.data.message.data.address);
      }

      if (e.data.message && e.data.message.action === "setNode") {
        console.log("setNode event", e.data.message)
        if (e.data.message.data.node && e.data.message.data.node.fullNode === "https://api.shasta.trongrid.io") {
          document.location.reload();
        }
      }

      if (e.data.message && e.data.message.action === "connect") {
        console.log("connect event", e.data.message.isTronLink);
      }

      if (e.data.message && e.data.message.action === "disconnect") {
        console.log("disconnect event", e.data.message.isTronLink);
      }

      if (e.data.message && e.data.message.action === "accountsChanged") {
        console.log("accountsChanged event", e.data.message);
        console.log("current address:", e.data.message.data.address);
      }

      if (e.data.message && e.data.message.action === "connectWeb") {
        console.log("connectWeb event", e.data.message);
        console.log("current address:", e.data.message.data.address);
      }

      if (e.data.message && e.data.message.action === "accountsChanged") {
        console.log("accountsChanged event", e.data.message);
      }

      if (e.data.message && e.data.message.action === "acceptWeb") {
        if (e.data.message.data.data.isAuth) {
          setAccount(e.data.message.data.data);
          setTimeout(() => {
            onActivateContracts();
          }, 1000);
        }
        console.log("acceptWeb event", e.data.message);
      }

      if (e.data.message && e.data.message.action === "disconnectWeb") {
        onExit();
        console.log("disconnectWeb event", e.data.message);
      }

      if (e.data.message && e.data.message.action === "rejectWeb") {
        console.log("rejectWeb event", e.data.message);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const onPopup = (current = null, item = null) => {
		setPopup({ current, item });
	};

  const onConnect = async () => {
    try {
      await window.tronLink.request({method: 'tron_requestAccounts'});
    } catch (err) {
      onPopup('error', 'TronLink extension is not installed');
    }
	};

  const onActivateContracts = async () => {
    const PlayersV4 = await window.tronLink.tronWeb.contract().at(contracts.PlayersV4);
    const BallV2 = await window.tronLink.tronWeb.contract().at(contracts.BallV2);
    const GoalV2 = await window.tronLink.tronWeb.contract().at(contracts.GoalV2);
    const FootballGame = await window.tronLink.tronWeb.contract().at(contracts.FootballGame);
    const contractsTemp = {
      PlayersV4,
      BallV2,
      GoalV2,
      FootballGame,
    };
    setContracts(contractsTemp);
	};

  useEffect(() => {
    if (typeof contracts.FootballGame !== 'string' && !isInit) {
      setInit(true);

      onGetMyPlayers();
      onGetMyStakedPlayers();
      onBalance();
    }
  }, [contracts]); // eslint-disable-line react-hooks/exhaustive-deps

  const onGetMyPlayers = () => {
    setLoadingPlayers(true);
    setMyPlayers([]);
    contracts.PlayersV4.balanceOf(account.address).call().then((playersCount) => {
      for (let i = 0; i < Number(playersCount._hex); i += 1) {
        setTimeout(() => {
          contracts.PlayersV4.tokenOfOwnerByIndex(account.address, i).call().then((player) => {
            setMyPlayers((myPlayersTemp) => [ ...myPlayersTemp, { ...players[Number(player._hex) - 1], isStake: false }]);
          });
        }, 10);
      }
      setTimeout(() => {
        setLoadingPlayers(false);
      }, 1000);
    });
	};

  const onGetMyStakedPlayers = () => {
    contracts.BallV2.myStakedPlayers().call().then((stakedPlayers) => {
      const array = stakedPlayers.map((player) => Number(player._hex));
      // for (let i = 0; i < array.length; i += 1) {
      //   contracts.BallV2.stakedPlayers(i).call().then((stakedPlayerInfo) => {
      //     console.log('!', stakedPlayerInfo.eatenAmount);
      //     setMyStakedPlayersLvls((myStakedPlayersLvlsTemp) => [ ...myStakedPlayersLvlsTemp, stakedPlayerInfo.eatenAmount]);
      //   });
      // }
      setMyStakedPlayers(array);
    });
	};

  const onGetMyStakedBalls = () => {
    contracts.GoalV2.totalBallStaked().call().then((stakedBalls) => {
      setMyStakedBalls(Number(stakedBalls._hex));
    });
	};

  const onGetClaimedBalls = () => {
    setLoadingBalls(true);
    contracts.BallV2.myClaimableView().call().then((claimedBallsTemp) => {
      setClaimedBalls(Number(claimedBallsTemp._hex));
      setTimeout(() => {
        setLoadingBalls(false);
      }, 1000);
    }).catch(() => {
      setTimeout(() => {
        setLoadingBalls(false);
      }, 1000);
    });
	};

  const onGetClaimedGoals = () => {
    setLoadingGoals(true);
    contracts.GoalV2.claimableView(account.address).call().then((claimedGoalsTemp) => {
      setClaimedGoals(Number(claimedGoalsTemp._hex));
      setTimeout(() => {
        setLoadingGoals(false);
      }, 1000);
    }).catch(() => {
      setTimeout(() => {
        setLoadingGoals(false);
      }, 1000);
    });
	};

  const onBalance = () => {
    contracts.BallV2.balanceOf(account.address).call().then((balanceOfBalls) => {
      setTimeout(() => {
        contracts.GoalV2.balanceOf(account.address).call().then((balanceOfGoals) => {
          setTokens({
            balls: Number(balanceOfBalls._hex),
            goals: Number(balanceOfGoals._hex),
          });
        });
      }, 500);
    });
	};

  const onExit = () => {
    setMyPlayers([]);
    setAccount(null);
    document.location.href = '/';
	};

  return (
    <>
      <div className="mobile_block">Best use from desktop version</div>
      {popup.current === 'loading' && (
        <div className="popup">
          <div className="popup_content">
            <div className="popup_title">Loading</div>
            <FontAwesomeIcon
              icon={['fas', 'spinner']}
              spin
              style={{ margin: '20px auto 0', display: 'flex' }}
            />
          </div>
        </div>
      )}
      {popup.current === 'success' && (
        <div className="popup">
          <div
            className="popup_close_panel"
            onClick={() => onPopup()}
          />
          <div className="popup_content">
            <div className="popup_icon">
              <FontAwesomeIcon
                icon={['fas', 'check']}
              />
            </div>
            {popup.item && (
              <div className="popup_subtitle popup_wrap">{popup.item}</div>
            )}
          </div>
        </div>
      )}
      {popup.current === 'error' && (
        <div className="popup">
          <div
            className="popup_close_panel"
            onClick={() => onPopup()}
          />
          <div className="popup_content">
            <div className="popup_title">Error</div>
            {popup.item && (
              <div className="popup_subtitle popup_wrap">{popup.item}</div>
            )}
          </div>
        </div>
      )}
      <div className="sidebar">
        <div className="sidebar_block">
          <img src="./img/logo.png" alt="" />
        </div>
        <div className="sidebar_block sidebar_block_menu">
          <Link to="/" className={location.pathname === '/' ? "sidebar_item active" : "sidebar_item"}>
            <img src="./img/star.png" alt="" />
            <span>Team</span>
          </Link>
          <Link
            to="/academy"
            className={location.pathname === '/academy' ? "sidebar_item active" : "sidebar_item"}
            style={!account ? { color: '#c4c4c4' } : {}}
            onClick={(e)=> {
              if (!account) {
                onPopup('auth');
                e.preventDefault();
              }
            }}
          >
            <img src="./img/grad-cap.png" alt="" />
            <span>Academy</span>
          </Link>
          <Link
            to="/marketplace"
            className={location.pathname === '/marketplace' ? "sidebar_item active" : "sidebar_item"}
            style={!account ? { color: '#c4c4c4' } : {}}
            onClick={(e)=> {
              if (!account) {
                onPopup('auth');
                e.preventDefault();
              }
            }}
          >
            <img src="./img/football.png" alt="" />
            <span>Marketplace</span>
          </Link>
          <Link
            to="/battles"
            className={location.pathname === '/battles' ? "sidebar_item active" : "sidebar_item"}
            style={!account ? { color: '#c4c4c4' } : {}}
            onClick={(e)=> {
              if (!account) {
                onPopup('auth');
                e.preventDefault();
              }
            }}
          >
            <img src="./img/net.png" alt="" />
            <span>Matches</span>
          </Link>
          <Link
            to="#"
            className="sidebar_item"
            style={!account ? { color: '#c4c4c4', cursor: 'default' } : { cursor: 'default' }}
          >
            <img src="./img/cup.png" alt="" />
            <span>
              Champions Cup
              <span style={{ fontSize: 10, display: 'block', color: '#c4c4c4', marginTop: 5 }}>Coming soon</span>
            </span>
          </Link>
        </div>
        <div className="sidebar_block sidebar_block_bottom">
          <a className="discord_block" href="https://docs.google.com/presentation/d/1-OkhgdZIFJuXmFKdQRAFIxKvY-MCsWMhgd02l6AXjOE/" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={['fas', 'circle-info']} />About NFTBL
          </a>
          <div className="subtitle" style={{ fontSize: 12 }}>Made for Tron 2022</div>
        </div>
      </div>
      <div className="content">
        <Routes>
          <Route
            path="/"
            exact
            element={<Home
              account={account}
              onExit={onExit}
              onConnect={onConnect}
              tokens={tokens}
              myPlayers={myPlayers}
              isLoadingPlayers={isLoadingPlayers}
            />}
          />
          <Route
            path="/academy"
            exact
            element={<Academy
              onPopup={onPopup}
              account={account}
              onExit={onExit}
              onGetClaimedBalls={onGetClaimedBalls}
              onGetClaimedGoals={onGetClaimedGoals}
              claimedGoals={claimedGoals}
              claimedBalls={claimedBalls}
              onConnect={onConnect}
              tokens={tokens}
              myPlayers={myPlayers}
              myStakedPlayers={myStakedPlayers}
              myStakedBalls={myStakedBalls}
              contracts={contracts}
              setMyStakedPlayers={setMyStakedPlayers}
              onBalance={onBalance}
              isLoadingBalls={isLoadingBalls}
              isLoadingGoals={isLoadingGoals}
              onGetMyStakedBalls={onGetMyStakedBalls}
              isInitAcademy={isInitAcademy}
              setInitAcademy={setInitAcademy}
              isLoadingPlayers={isLoadingPlayers}
            />}
          />
          <Route
            path="/battles"
            exact
            element={<Battles
              onPopup={onPopup}
              account={account}
              players={players}
              myPlayers={myPlayers}
              myStakedPlayers={myStakedPlayers}
              tokens={tokens}
              setTokens={setTokens}
              onExit={onExit}
              contracts={contracts}
              isLoadingPlayers={isLoadingPlayers}
            />}
          />
          <Route
            path="/marketplace"
            exact
            element={<Marketplace
              onPopup={onPopup}
              account={account}
              onExit={onExit}
              tokens={tokens}
              contracts={contracts}
              onGetMyPlayers={onGetMyPlayers}
            />}
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
