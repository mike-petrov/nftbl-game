//SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;
import "./ERC20.sol";
import "./IERC721.sol";
import "./Authorizable.sol";
import "./PlayersV4.sol";

contract BallV2 is ERC20, Authorizable { 
    string private TOKEN_NAME = "BALL";
    string private TOKEN_SYMBOL = "BALL";

    address public PLAYER_CONTRACT;

    // the base number of $BALL per player (i.e. 0.75 $BALL)
    uint256 public BASE_HOLDERS_BALLS = 750000000000000000;

    // the number of $BALL per player per day per lvl (i.e. 0.25 $BALL /player /day /lvl)
    uint256 public BALLS_PER_DAY_PER_LVL = 250000000000000000;

    // how much ball it costs to skip the cooldown
    uint256 public COOLDOWN_BASE = 100000000000000000000; // base 100
    // how much additional ball it costs to skip the cooldown per lvl
    uint256 public COOLDOWN_BASE_FACTOR = 100000000000000000000; // additional 100 per lvl
    // how long to wait before skip cooldown can be re-invoked
    uint256 public COOLDOWN_CD_IN_SECS = 86400; // additional 100 per lvl

    uint256 public LEVELING_BASE = 25;
    uint256 public LEVELING_RATE = 2;
    uint256 public COOLDOWN_RATE = 3600; // 60 mins

    /**
     * Stores staked player fields (=> 152 <= stored in order of size for optimal packing!)
     */
    struct StakedPlayerObj {
        // the current lvl level (0 -> 16,777,216)
        uint24 lvl;
        // when to calculate ball from (max 20/02/36812, 11:36:16)
        uint32 sinceTs;
        // for the skipCooldown's cooldown (max 20/02/36812, 11:36:16)
        uint32 lastSkippedTs;
        // how much this player has been fed (in whole numbers)
        uint48 eatenAmount;
        // cooldown time until level up is allow (per lvl)
        uint32 cooldownTs;
    }

    uint40 public totallvl;
    uint16 public totalStakedPlayers;

    StakedPlayerObj[100001] public stakedPlayers;

    // Events

    event Minted(address owner, uint256 amt);
    event Burned(address owner, uint256 amt);
    event Staked(uint256 tid, uint256 ts);
    event UnStaked(uint256 tid, uint256 ts);

    // Constructor

    constructor(address _playerContract) ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        PLAYER_CONTRACT = _playerContract;
    }

    // "READ" Functions
    // How much is required to be fed to level up per lvl

    function goalLevelingRate(uint256 lvl) public view returns (uint256) {
        // need to divide the lvl by 100, and make sure the goal level is at 18 decimals
        return LEVELING_BASE * ((lvl / 100)**LEVELING_RATE);
    }

    // when using the value, need to add the current block timestamp as well
    function cooldownRate(uint256 lvl) public view returns (uint256) {
        // need to divide the lvl by 100

        return (lvl / 100) * COOLDOWN_RATE;
    }

    // Staking Functions

    // stake player, check if is already staked, get all detail for player such as
    function _stake(uint256 tid) internal {
        PlayersV4 x = PlayersV4(PLAYER_CONTRACT);

        // verify user is the owner of the player...
        require(x.ownerOf(tid) == msg.sender, "NOT OWNER");

        // get calc'd values...
        (, , , , , , , uint256 lvl) = x.allPlayers(tid);
        // if lastSkippedTs is 0 its mean it never have a last skip timestamp
        StakedPlayerObj memory c = stakedPlayers[tid];
        uint32 ts = uint32(block.timestamp);
        if (stakedPlayers[tid].lvl == 0) {
            // create staked player...
            stakedPlayers[tid] = StakedPlayerObj(
                uint24(lvl),
                ts,
                c.lastSkippedTs > 0 ? c.lastSkippedTs :  uint32(ts - COOLDOWN_CD_IN_SECS),
                uint48(0),
                uint32(ts) + uint32(cooldownRate(lvl)) 
            );

            totalStakedPlayers += 1;
            totallvl += uint24(lvl);

            // let ppl know!
            emit Staked(tid, block.timestamp);
        }
    }

    function stake(uint256[] calldata tids) external {
        for (uint256 i = 0; i < tids.length; i++) {
            _stake(tids[i]);
        }
    }

    /**
     * Calculates the amount of ball that is claimable from a player.
     */
    function claimableView(uint256 tokenId) public view returns (uint256) {
        StakedPlayerObj memory c = stakedPlayers[tokenId];
        if (c.lvl > 0) {
            uint256 ballPerDay = ((BALLS_PER_DAY_PER_LVL * (c.lvl / 100)) +
                BASE_HOLDERS_BALLS);
            uint256 deltaSeconds = block.timestamp - c.sinceTs;
            return deltaSeconds * (ballPerDay / 86400);
        } else {
            return 0;
        }
    }

    /**
     * Get all MY staked player id
     */

    function myStakedPlayers() public view returns (uint256[] memory) {
        PlayersV4 x = PlayersV4(PLAYER_CONTRACT);
        uint256 playerCount = x.balanceOf(msg.sender);
        uint256[] memory tokenIds = new uint256[](playerCount);
        uint256 counter = 0;
        for (uint256 i = 0; i < playerCount; i++) {
            uint256 tokenId = x.tokenOfOwnerByIndex(msg.sender, i);
            StakedPlayerObj memory player = stakedPlayers[tokenId];
            if (player.lvl > 0) {
                tokenIds[counter] = tokenId;
                counter++;
            }
        }
        return tokenIds;
    }

    /**
     * Calculates the TOTAL amount of ball that is claimable from ALL players.
     */
    function myClaimableView() public view returns (uint256) {
        PlayersV4 x = PlayersV4(PLAYER_CONTRACT);
        uint256 cnt = x.balanceOf(msg.sender);
        require(cnt > 0, "NO player");
        uint256 totalClaimable = 0;
        for (uint256 i = 0; i < cnt; i++) {
            uint256 tokenId = x.tokenOfOwnerByIndex(msg.sender, i);
            StakedPlayerObj memory player = stakedPlayers[tokenId];
            // make sure that the token is staked
            if (player.lvl > 0) {
                uint256 claimable = claimableView(tokenId);
                if (claimable > 0) {
                    totalClaimable = totalClaimable + claimable;
                }
            }
        }
        return totalClaimable;
    }

    /**
     * Claims balls from the provided players.
     */
    function _claimBalls(uint256[] calldata tokenIds) internal {
        PlayersV4 x = PlayersV4(PLAYER_CONTRACT);
        uint256 totalClaimableball = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(x.ownerOf(tokenIds[i]) == msg.sender, "NOT OWNER");
            StakedPlayerObj memory player = stakedPlayers[tokenIds[i]];
            // we only care about player that have been staked (i.e. lvl > 0) ...
            if (player.lvl > 0) {
                uint256 claimableball = claimableView(tokenIds[i]);
                if (claimableball > 0) {
                    totalClaimableball = totalClaimableball + claimableball;
                    // reset since, for the next calc...
                    player.sinceTs = uint32(block.timestamp);
                    stakedPlayers[tokenIds[i]] = player;
                }
            }
        }
        if (totalClaimableball > 0) {
            _mint(msg.sender, totalClaimableball);
            emit Minted(msg.sender, totalClaimableball);
        }
    }

    /**
     * Claims balls from the provided players.
     */
    function claimBalls(uint256[] calldata tokenIds) external {
        _claimBalls(tokenIds);
    }

    /**
     * Unstakes a player. Why you'd call this, I have no idea.
     */
    function _unstake(uint256 tokenId) internal {
        PlayersV4 x = PlayersV4(PLAYER_CONTRACT);

        // verify user is the owner of the player...
        require(x.ownerOf(tokenId) == msg.sender, "NOT OWNER");

        // update player...
        StakedPlayerObj memory c = stakedPlayers[tokenId];
        if (c.lvl > 0) {
            // update snapshot values...
            totallvl -= uint24(c.lvl);
            totalStakedPlayers -= 1;

            c.lvl = 0;
            stakedPlayers[tokenId] = c;

            // let ppl know!
            emit UnStaked(tokenId, block.timestamp);
        }
    }

    function _unstakeMultiple(uint256[] calldata tids) internal {
        for (uint256 i = 0; i < tids.length; i++) {
            _unstake(tids[i]);
        }
    }

    /**
     * Unstakes MULTIPLE player. Why you'd call this, I have no idea.
     */
    function unstake(uint256[] calldata tids) external {
        _unstakeMultiple(tids);
    }

    /**
     * Unstakes MULTIPLE player AND claims the balls.
     */
    function withdrawAllPlayersAndClaim(uint256[] calldata tids) external {
        _claimBalls(tids);
        _unstakeMultiple(tids);
    }

    /**
     * Public : update the player's lvl level.
     */
     function levelUpPlayer(uint256 tid) external {
        StakedPlayerObj memory c = stakedPlayers[tid];
        require(c.lvl > 0, "NOT STAKED");

        PlayersV4 x = PlayersV4(PLAYER_CONTRACT);
        // NOTE Does it matter if sender is not owner?
        // require(x.ownerOf(playerId) == msg.sender, "NOT OWNER");

        // check: player has eaten enough...
        require(c.eatenAmount >= goalLevelingRate(c.lvl), "MORE FOOD REQD");
        // check: cooldown has passed...
        require(block.timestamp >= c.cooldownTs, "COOLDOWN NOT MET");

        // increase lvl, reset eaten to 0, update next goal level and cooldown time
        c.lvl = c.lvl + 100;
        c.eatenAmount = 0;
        c.cooldownTs = uint32(block.timestamp + cooldownRate(c.lvl));
        stakedPlayers[tid] = c;

        // need to increase overall size
        totallvl += uint24(100);

        // and update the player contract
        x.setLvl(tid, c.lvl);
    }

    /**
     * Internal: burns the given amount of balls from the wallet.
     */
    function _burnBalls(address sender, uint256 ballAmount) internal {
        // NOTE do we need to check this before burn?
        require(balanceOf(sender) >= ballAmount, "NOT ENOUGH BALL");
        _burn(sender, ballAmount);
        emit Burned(sender, ballAmount);
    }

    /**
     * Burns the given amount of balls from the sender's wallet.
     */
    function burnBalls(address sender, uint256 ballsAmount) external onlyAuthorized {
        _burnBalls(sender, ballsAmount);
    }

    /**
     * Skips the "levelUp" cooling down period, in return for burning ball.
     */
     function skipCoolingOff(uint256 tokenId, uint256 ballAmt) external {
        StakedPlayerObj memory player = stakedPlayers[tokenId];
        require(player.lvl != 0, "NOT STAKED");

        uint32 ts = uint32(block.timestamp);
        // check: enough ball in wallet to pay
        uint256 walletBalance = balanceOf(msg.sender);
        require( walletBalance >= ballAmt, "NOT ENOUGH BALL IN WALLET");

        // check: provided ball amount is enough to skip this level
        require(ballAmt >= checkSkipCoolingOffAmt(player.lvl), "NOT ENOUGH BALL TO SKIP");

        // check: user hasn't skipped cooldown in last 24 hrs
        require((player.lastSkippedTs + COOLDOWN_CD_IN_SECS) <= ts, "BLOCKED BY 24HR COOLDOWN");

        // burn balls
        _burnBalls(msg.sender, ballAmt);

        // disable cooldown
        player.cooldownTs = ts;
        // track last time cooldown was skipped (i.e. now)
        player.lastSkippedTs = ts;
        stakedPlayers[tokenId] = player;
    }

    /**
     * Calculates the cost of skipping cooldown.
     */
    function checkSkipCoolingOffAmt(uint256 lvl) public view returns (uint256) {
        return ((lvl / 100) * COOLDOWN_BASE_FACTOR);
    }


    function upgradePlayer(uint256 tokenId, uint256 amount)
        external
        onlyAuthorized
    {
        StakedPlayerObj memory player = stakedPlayers[tokenId];
        require(player.lvl > 0, "NOT STAKED");
        require(amount > 0, "NOTHING TO BURN");
        // update the block time as well as claimable
        player.eatenAmount = uint48(amount / 1e18) + player.eatenAmount;
        stakedPlayers[tokenId] = player;
    }

    // ADMIN: to update the cost of skipping cooldown
    function updateSkipCooldownValues(
        uint256 a, 
        uint256 b, 
        uint256 c,
        uint256 d,
        uint256 e
    ) external onlyOwner {
        COOLDOWN_BASE = a;
        COOLDOWN_BASE_FACTOR = b;
        COOLDOWN_CD_IN_SECS = c;
        BASE_HOLDERS_BALLS = d;
        BALLS_PER_DAY_PER_LVL = e;
    }

    // INTRA-CONTRACT: use this function to mint ball to users
    // this also get called by the goal contract
    function mintBall(address sender, uint256 amount) external onlyAuthorized {
        _mint(sender, amount);
        emit Minted(sender, amount);
    }

}