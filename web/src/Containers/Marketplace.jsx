import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Marketplace = ({
    onPopup,
    players,
    account,
    tokens,
    onExit,
    contracts,
    onInit,
  }) => {
  const onBuy = (amount) => {
    contracts.PlayersV4.mint(amount).send().then((mintTemp) => {
      setTimeout(() => {
        onPopup('success', 'Your team has been replenished with new players');
        onInit();
      }, 2000);
    });
	};

  return (
    <div className="container">
      <div className="header">
        <div className="title">Marketplace</div>
        <div className="subtitle">Limited NFT Collection</div>
        {account && (
            <div className="header_block">
              <div>
                <span style={{ background: '#3e4de5', display: 'flex', alignItems: 'center' }}>
                  <img src="./img/ball.png" alt="" />
                  <span>{tokens.balls}</span>
                </span>
                <span style={{ background: '#3e4de5', display: 'flex', alignItems: 'center' }}>
                  <img src="./img/goal.png" alt="" />
                  <span>{tokens.goals}</span>
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
          <div className="p2p_subtitle">Surprize Box</div>
          {[
            { name: 'Silver Pack', count: 1 },
            { name: 'Rare Pack', count: 3 },
            { name: 'Gold Pack', count: 5 },
            { name: 'Premium Pack', count: 10 },
          ].map((gift, index) => (
            <div className="card" key={gift.count}>
              <img src={`./img/players/gift${index + 1}.png`} alt="" />
              <div className="card_content">
                <div className="card_number">{`NO. ${index + 1}`}</div>
                <div className="card_title">
                  <span>Name</span>
                  {` ${gift.name}`}
                </div>
                <div className="card_title">
                  <span>Price</span>
                  {` ${gift.count * 10} trx`}
                </div>
                <div
                  className="btn"
                  style={{ margin: '20px 0 0 0' }}
                  onClick={() => onBuy(gift.count)}
                >Buy</div>
              </div>
            </div>
          ))}
          <div className="p2p_subtitle">Users NFT</div>
          <div className="banner">
            <div className="banner_subtitle" style={{ marginBottom: 0 }}>No one put their players on the marketplace </div>
          </div>
          {/* {players && players.map((player) => (
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
          ))} */}
        </div>
      </div>
    </div>
  );
}

export default Marketplace;
