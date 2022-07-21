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
} from '@fortawesome/free-solid-svg-icons';
import {
    faHeart,
} from '@fortawesome/free-regular-svg-icons';
import './App.css';

library.add(
	faTimes,
  faHeart,
  faSpinner,
  faRightFromBracket,
  faLink,
  faCheck,
  faRotate,
);

// const TronWeb = require('tronweb');
// const tronWeb = new TronWeb({
//   fullHost: 'https://api.shasta.trongrid.io/',
// })

const App = () => {
  const location = useLocation();

  const [contracts, setContracts] = useState({
    PlayersV4: 'TBpkDAhepL9FPtdP5mVGETqUN5gn8z6g9o',
    BallV2: 'TMSE87jKvR2SWKG2sWLoBDrZy32atjJHzV',
    GoalV2:  'TTMgs4mYh1MMSpTAutfQCRuBCPx1LZ3gBp',
    FootballGame: 'TXywmA9nboJbKugcnrkjcvYcJJmXWFkH4j',
  });
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
  const [players] = useState([{
    id: '0001',
    name: 'Timothy Daniels',
    position: 'DM',
    rating: 88,
    src: './img/players/1.png',
  }, {
    id: '0002',
    name: 'Joe Smith',
    position: 'LB',
    rating: 57,
    src: './img/players/2.png',
  }, {
    id: '0003',
    name: 'John Neal',
    position: 'RB',
    rating: 60,
    src: './img/players/3.png',
  }, {
    id: '0004',
    name: 'Oscar Jones',
    position: 'GK',
    rating: 94,
    src: './img/players/4.png',
  }, {
    id: '0005',
    name: 'Philip Ray',
    position: 'LW',
    rating: 40,
    src: './img/players/5.png',
  }, {
    id: '0006',
    name: 'William Wilson',
    position: 'RW',
    rating: 44,
    src: './img/players/6.png',
  }, {
    id: '0007',
    name: 'Bradley Padilla',
    position: 'CF',
    rating: 79,
    src: './img/players/7.png',
  }, {
    id: '0008',
    name: 'Jeffrey Lamb',
    position: 'RB',
    rating: 82,
    src: './img/players/8.png',
  }, {
    id: '0009',
    name: 'Wesley Brown',
    position: 'DM',
    rating: 85,
    src: './img/players/9.png',
  }, {
    id: '0010',
    name: 'Steven White',
    position: 'LM',
    rating: 38,
    src: './img/players/10.png',
  }, {
    id: '0011',
    name: 'Stanley Horton',
    position: 'RM',
    rating: 20,
    src: './img/players/11.png',
  }, {
    id: '0012',
    name: 'Dale Vega',
    position: 'CF',
    rating: 16,
    src: './img/players/12.png',
  }]);
  const [popup, setPopup] = useState({ current: null, item: null });

  useEffect(() => {
    // if (!account && document.location.pathname !== '/') {
    //   document.location.href = '/';
    // }

    window.addEventListener('message', (e) => {
      if (e.data.message && e.data.message.action === "tabReply") {
        console.log("tabReply event", e.data.message);
        if (e.data.message.data.data.isAuth) {
          setAccount(e.data.message.data.data);
          setTimeout(() => {
            onABI().then((contractsTemp) => {
              onInit(e.data.message.data.data, contractsTemp);
            });
          }, 1000);
        }
      }

      if (e.data.message && e.data.message.action === "setAccount") {
        console.log("setAccount event", e.data.message);
        console.log("current address:", e.data.message.data.address);
      }

      if (e.data.message && e.data.message.action === "setNode") {
        console.log("setNode event", e.data.message)
        if (e.data.message.data.node.chain === '_') {
          console.log("tronLink currently selects the main chain");
        } else {
          console.log("tronLink currently selects the side chain");
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
            onABI().then((contractsTemp) => {
              onInit(e.data.message.data.data, contractsTemp);
            });
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

  const onABI = async () => {
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
    return contractsTemp;
	};

  const onInit = (accountTemp = account, contractsTemp = contracts) => {
    setMyPlayers([]);
    contractsTemp.PlayersV4.balanceOf(accountTemp.address).call().then((playersCount) => {
      for (let i = 0; i < Number(playersCount._hex); i += 1) {
        contractsTemp.PlayersV4.tokenOfOwnerByIndex(accountTemp.address, i).call().then((player) => {
          setMyPlayers((myPlayersTemp) => [ ...myPlayersTemp, { ...players[Number(player._hex) - 1], isStake: false }]);
        });
      }
    });

    contractsTemp.BallV2.myStakedPlayers().call().then((stakedPlayers) => {
      const array = stakedPlayers.map((player) => Number(player._hex));
      // for (let i = 0; i < array.length; i += 1) {
      //   contractsTemp.BallV2.stakedPlayers(i).call().then((stakedPlayerInfo) => {
      //     console.log('!', stakedPlayerInfo.eatenAmount);
      //     setMyStakedPlayersLvls((myStakedPlayersLvlsTemp) => [ ...myStakedPlayersLvlsTemp, stakedPlayerInfo.eatenAmount]);
      //   });
      // }
      setMyStakedPlayers(array);
    });

    contractsTemp.GoalV2.totalBallStaked().call().then((stakedBalls) => {
      setMyStakedBalls(Number(stakedBalls._hex));
    });

    onGetClaimedBalles(contractsTemp);

    onGetClaimedGoals(accountTemp, contractsTemp);

    onBalance(accountTemp, contractsTemp);
	};

  const onPopup = (current = null, item = null) => {
		setPopup({ current, item });
	};

  const onConnect = async () => {
    await window.tronLink.request({method: 'tron_requestAccounts'});
	};

  const onExit = () => {
    setMyPlayers([]);
    setAccount(null);
    document.location.href = '/';
	};

  const onBalance = (accountTemp = account, contractsTemp = contracts) => {
    contractsTemp.BallV2.balanceOf(accountTemp.address).call().then((balanceOfBalls) => {
      contractsTemp.GoalV2.balanceOf(accountTemp.address).call().then((balanceOfGoals) => {
        setTokens({
          balls: Number(balanceOfBalls._hex),
          goals: Number(balanceOfGoals._hex),
        });
      });
    });
	};

  const onGetClaimedBalles = (contractsTemp = contracts) => {
    contractsTemp.BallV2.myClaimableView().call().then((claimedBallsTemp) => {
      setClaimedBalls(Number(claimedBallsTemp._hex));
    });
	};

  const onGetClaimedGoals = (accountTemp = account, contractsTemp = contracts) => {
    contractsTemp.GoalV2.claimableView(accountTemp.address).call().then((claimedGoalsTemp) => {
      setClaimedGoals(Number(claimedGoalsTemp._hex));
    });
	};

  return (
    <>
      <div className="mobile_block">Best use from desktop version</div>
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
              Champion Cup
              <span style={{ fontSize: 10, display: 'block', color: '#c4c4c4', marginTop: 5 }}>Coming soon</span>
            </span>
          </Link>
        </div>
        <div className="sidebar_block sidebar_block_bottom">
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
              onBalance={onBalance}
            />}
          />
          <Route
            path="/academy"
            exact
            element={<Academy
              onPopup={onPopup}
              account={account}
              onExit={onExit}
              onGetClaimedBalles={onGetClaimedBalles}
              onGetClaimedGoals={onGetClaimedGoals}
              claimedGoals={claimedGoals}
              claimedBalls={claimedBalls}
              onConnect={onConnect}
              tokens={tokens}
              setClaimedBalls={setClaimedBalls}
              setClaimedGoals={setClaimedGoals}
              myPlayers={myPlayers}
              myStakedPlayers={myStakedPlayers}
              myStakedBalls={myStakedBalls}
              contracts={contracts}
              setMyStakedPlayers={setMyStakedPlayers}
              onBalance={onBalance}
              onInit={onInit}
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
            />}
          />
          <Route
            path="/marketplace"
            exact
            element={<Marketplace
              onPopup={onPopup}
              account={account}
              onExit={onExit}
              players={players}
              tokens={tokens}
              setMyPlayers={setMyPlayers}
              myPlayers={myPlayers}
              contracts={contracts}
              onInit={onInit}
            />}
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
