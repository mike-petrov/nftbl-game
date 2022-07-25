import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Marketplace = ({
    onPopup,
    account,
    tokens,
    onExit,
    contracts,
    onGetMyPlayers,
  }) => {
  const onBuy = (type, price, amount) => {
    const priceTemp = price * 1e+6;
    contracts.PlayersV4.mint(amount).send({
      feeLimit:100_000_000,
      callValue: priceTemp,
    }).then(() => {
      setTimeout(() => {
        onPopup('success', 'Your team has been replenished with new players');
        onGetMyPlayers();
      }, 3000);
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
          <div className="p2p_subtitle">Surprize Box</div>
          {[
            { name: 'Silver Pack', price: 100, count: 1 },
            { name: 'Bronze Pack', price: 150, count: 1 },
            { name: 'Epic Pack', price: 300, count: 1 },
            { name: 'Legendary Pack', price: 500, count: 1 },
          ].map((gift, index) => (
            <div className="card" key={gift.name}>
              <img src={`./img/players/gift${index + 1}.png`} alt="" />
              <div className="card_content">
                <div className="card_number">{`NO. ${index + 1}`}</div>
                <div className="card_title">
                  <span>Name</span>
                  {` ${gift.name}`}
                </div>
                <div className="card_title">
                  <span>Price</span>
                  {` ${gift.price} trx`}
                </div>
                <div
                  className="btn"
                  style={{ margin: '20px 0 0 0' }}
                  onClick={() => onBuy(gift.name, gift.price, gift.count)}
                >Buy</div>
              </div>
            </div>
          ))}
          <div className="p2p_subtitle">Players of other users</div>
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
