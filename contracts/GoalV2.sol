//SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./ERC20.sol";
import "./IERC721.sol";
import "./Authorizable.sol";
import "./PlayersV4.sol";
import "./BallV2.sol";


contract GoalV2 is ERC20, Authorizable {
    uint256 public MAX_goal_SUPPLY = 32000000000000000000000000000;
    string private TOKEN_NAME = "GOAL";
    string private TOKEN_SYMBOL = "GOAL";

    address public PLAYER_CONTRACT;
    address public BALL_CONTRACT;

    uint256 public BOOSTER_MULTIPLIER = 1;
    uint256 public goal_FARMING_FACTOR = 3; // ball to goal ratio
    uint256 public goal_SWAP_FACTOR = 12; // swap ball for goal ratio

    // goal mint event
    event Minted(address owner, uint256 numberOfgoal);
    event Burned(address owner, uint256 numberOfgoal);
    event BallSwap(address owner, uint256 numberOfgoal);
    // ball event
    event MintedBall(address owner, uint256 numberOfgoal);
    event BurnedBall(address owner, uint256 numberOfballs);
    event StakedBall(address owner, uint256 numberOfballs);
    event UnstakedBall(address owner, uint256 numberOfballs);

    // ball staking
    struct BallStake {
        // user wallet - who we have to pay back for the staked ball.
        address user;
        // used to calculate how much goal since.
        uint32 since;
        // amount of balls that have been staked.
        uint256 amount;
    }

    mapping(address => BallStake) public ballStakeHolders;
    uint256 public totalBallStaked;
    address[] public _allBallStakeHolders;
    mapping(address => uint256) private _allBallStakeHoldersIndex;

    // ball stake and unstake
    event BallStaked(address user, uint256 amount);
    event BallUnStaked(address user, uint256 amount);

    constructor(address _playerContract, address _ballContract)
        ERC20(TOKEN_NAME, TOKEN_SYMBOL)
    {
        PLAYER_CONTRACT = _playerContract;
        BALL_CONTRACT = _ballContract;
    }

    /**
     * pdates user's amount of staked balls to the given value. Resets the "since" timestamp.
     */
    function _upsertBallStaking(
        address user,
        uint256 amount
    ) internal {
        // NOTE does this ever happen?
        require(user != address(0), "EMPTY ADDRESS");
        BallStake memory ball = ballStakeHolders[user];

        // if first time user is staking $ball...
        if (ball.user == address(0)) {
            // add tracker for first time staker
            _allBallStakeHoldersIndex[user] = _allBallStakeHolders.length;
            _allBallStakeHolders.push(user);
        }
        // since its an upsert, we took out old ball and add new amount
        uint256 previousBalls = ball.amount;
        // update stake
        ball.user = user;
        ball.amount = amount;
        ball.since = uint32(block.timestamp);

        ballStakeHolders[user] = ball;
        totalBallStaked = totalBallStaked - previousBalls + amount;
        emit BallStaked(user, amount);
    }

    function staking(uint256 amount) external {
        require(amount > 0, "NEED ball");
        BallV2 ballContract = BallV2(BALL_CONTRACT);
        uint256 available = ballContract.balanceOf(msg.sender);
        require(available >= amount, "NOT ENOUGH ball");
        BallStake memory existingball = ballStakeHolders[msg.sender];
        if (existingball.amount > 0) {
            // already have previous ball staked
            // need to calculate claimable
            uint256 projection = claimableView(msg.sender);
            // mint goal to wallet
            _mint(msg.sender, projection);
            emit Minted(msg.sender, amount);
            _upsertBallStaking(msg.sender, existingball.amount + amount);
        } else {
            // no ball staked just update staking
            _upsertBallStaking(msg.sender, amount);
        }
        ballContract.burnBalls(msg.sender, amount);
        emit StakedBall(msg.sender, amount);
    }

    /**
     * Calculates how much goal is available to claim.
     */
    function claimableView(address user) public view returns (uint256) {
        BallStake memory ball = ballStakeHolders[user];
        require(ball.user != address(0), "NOT STAKED");
        // need to add 10000000000 to factor for decimal
        return
            ((ball.amount * goal_FARMING_FACTOR) *
                (((block.timestamp - ball.since) * 10000000000) / 86400) *
                BOOSTER_MULTIPLIER) /
            10000000000;
    }

    // NOTE withdrawing ball without claiming goal
    function withdrawBall(uint256 amount) external {
        require(amount > 0, "MUST BE MORE THAN 0");
        BallStake memory ball = ballStakeHolders[msg.sender];
        require(ball.user != address(0), "NOT STAKED");
        require(amount <= ball.amount, "OVERDRAWN");
        BallV2 ballContract = BallV2(BALL_CONTRACT);
        // uint256 projection = claimableView(msg.sender);
        _upsertBallStaking(msg.sender, ball.amount - amount);
        // Need to burn 1/12 when withdrawing (breakage fee)
        uint256 afterBurned = (amount * 11) / 12;
        // mint ball to return to user
        ballContract.mintBall(msg.sender, afterBurned);
        emit UnstakedBall(msg.sender, afterBurned);
    }

    /**
     * Claims goal from staked Ball
     */
    function claimGoal() external {
        uint256 projection = claimableView(msg.sender);
        require(projection > 0, "NO goal TO CLAIM");

        BallStake memory ball = ballStakeHolders[msg.sender];

        // Updates user's amount of staked balls to the given value. Resets the "since" timestamp.
        _upsertBallStaking(msg.sender, ball.amount);

        // check: that the total goal supply hasn't been exceeded.
        _mintgoal(msg.sender, projection);
    }

    /**
     */
    function _removeUserFromBallEnumeration(address user) private {
        uint256 lastUserIndex = _allBallStakeHolders.length - 1;
        uint256 currentUserIndex = _allBallStakeHoldersIndex[user];

        address lastUser = _allBallStakeHolders[lastUserIndex];

        _allBallStakeHolders[currentUserIndex] = lastUser; // Move the last token to the slot of the to-delete token
        _allBallStakeHoldersIndex[lastUser] = currentUserIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete _allBallStakeHoldersIndex[user];
        _allBallStakeHolders.pop();
    }

    /**
     * Unstakes the balls, returns the balls (mints) to the user.
     */
    function withdrawAllBallsAndClaimGoal() external {
        BallStake memory ball = ballStakeHolders[msg.sender];

        // NOTE does this ever happen?
        require(ball.user != address(0), "NOT STAKED");

        // if there's goal to claim, supply it to the owner...
        uint256 projection = claimableView(msg.sender);
        if (projection > 0) {
            // supply goal to the sender...
            _mintgoal(msg.sender, projection);
        }
        // if there's ball to withdraw, supply it to the owner...
        if (ball.amount > 0) {
            // mint ball to return to user
            // Need to burn 1/12 when withdrawing (breakage fee)
            uint256 afterBurned = (ball.amount * 11) / 12;
            BallV2 ballContract = BallV2(BALL_CONTRACT);
            ballContract.mintBall(msg.sender, afterBurned);
            emit UnstakedBall(msg.sender, afterBurned);
        }
        // Internal: removes ball from storage.
        _unstakingball(msg.sender);
    }

    /**
     * Internal: removes ball from storage.
     */
    function _unstakingball(address user) internal {
        BallStake memory ball = ballStakeHolders[user];
        // NOTE when whould address be zero?
        require(ball.user != address(0), "EMPTY ADDRESS");
        totalBallStaked = totalBallStaked - ball.amount;
        _removeUserFromBallEnumeration(user);
        delete ballStakeHolders[user];
        emit BallUnStaked(user, ball.amount);
    }

    /**
     * feeds the player the amount of goal.
     */
    function upgradePlayer(uint256 playerId, uint256 amount) external {
        require(amount > 0, "MUST BE MORE THAN 0 GOAL");

        IERC721 instance = IERC721(PLAYER_CONTRACT);

        require(instance.ownerOf(playerId) == msg.sender, "NOT OWNER");
        
        // check: user has enough goal in wallet...
        require(balanceOf(msg.sender) >= amount, "NOT ENOUGH GOAL");
        
        // TODO should this be moved to ball contract? or does the order here, matter?
        BallV2 ballContract = BallV2(BALL_CONTRACT);
        (uint24 kg, , , , ) = ballContract.stakedPlayers(playerId);
        require(kg > 0, "NOT STAKED");

        // burn goal...
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);

        // update eatenAmount in ballV2 contract...
        ballContract.upgradePlayer(playerId, amount);
    }

    function swapBallForGoal(uint256 ballAmt) external {
        require(ballAmt > 0, "MUST BE MORE THAN 0 ball");

        // burn balls...
        BallV2 ballContract = BallV2(BALL_CONTRACT);
        ballContract.burnBalls(msg.sender, ballAmt);

        // supply goal...
        _mint(msg.sender, ballAmt * goal_SWAP_FACTOR);
        emit BallSwap(msg.sender, ballAmt * goal_SWAP_FACTOR);
    }

    /**
     * Internal: mints the goal to the given wallet.
     */
    function _mintgoal(address sender, uint256 goalAmount) internal {
        // check: that the total goal supply hasn't been exceeded.
        require(totalSupply() + goalAmount < MAX_goal_SUPPLY, "OVER MAX SUPPLY");
        _mint(sender, goalAmount);
        emit Minted(sender, goalAmount);
    }

    // ADMIN FUNCTIONS

    /**
     * Admin : mints the goal to the given wallet.
     */
    function mintgoal(address sender, uint256 amount) external onlyOwner {
        _mintgoal(sender, amount);
    }

    /**
     * Admin : used for temporarily multipling how much goal is distributed per staked ball.
     */
    function updateBoosterMultiplier(uint256 _value) external onlyOwner {
        BOOSTER_MULTIPLIER = _value;
    }

    /**
     * Admin : updates how much goal you get per staked ball (e.g. 3x).
     */
    function updateFarmingFactor(uint256 _value) external onlyOwner {
        goal_FARMING_FACTOR = _value;
    }

    /**
     * Admin : updates the multiplier for swapping (burning) ball for goal (e.g. 12x).
     */
    function updategoalSwapFactor(uint256 _value) external onlyOwner {
        goal_SWAP_FACTOR = _value;
    }

    /**
     * Admin : updates the maximum available goal supply.
     */
    function updateMaxgoalSupply(uint256 _value) external onlyOwner {
        MAX_goal_SUPPLY = _value;
    }

    /**
     * Admin : util for working out how many people are staked.
     */
    function totalballHolder() public view returns (uint256) {
        return _allBallStakeHolders.length;
    }

    /**
     * Admin : gets the wallet for the the given index. Used for rebalancing.
     */
    function getballHolderByIndex(uint256 index) internal view returns (address){
        return _allBallStakeHolders[index];
    }

    /**
     * Admin : Rebalances the pool. Mint to the user's wallet. Only called if changing multiplier.
     */
    function rebalanceStakingPool(uint256 from, uint256 to) external onlyOwner {
        // for each holder of staked ball...
        for (uint256 i = from; i <= to; i++) {
            address holderAddress = getballHolderByIndex(i);

            // check how much goal is claimable...
            uint256 pendingClaim = claimableView(holderAddress);
            BallStake memory ball = ballStakeHolders[holderAddress];

            // supply goal to the owner's wallet...
            _mint(holderAddress, pendingClaim);
            emit Minted(holderAddress, pendingClaim);

            // pdates user's amount of staked balls to the given value. Resets the "since" timestamp.
            _upsertBallStaking(holderAddress, ball.amount);
        }
    }
}